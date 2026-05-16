import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

/** Repo root when tests run from `apps/web` (pnpm filter cwd). */
const repoRoot = path.resolve(process.cwd(), "..", "..");

type DomNodeRow = {
  nodeId: string;
  parentNodeId: string | null;
  depth: number;
  /** OpenFrame ids from root to this node, slash-separated (DOM ancestry chain with `data-of-node-id`). */
  path: string;
  tag: string;
  role: string | null;
  /** For native headings (`h1`–`h6`) or `role="heading"` with valid `aria-level`. */
  headingLevel: number | null;
  ariaLabel: string | null;
  title: string | null;
  alt: string | null;
  /** Resolved `href` for `<a>` nodes (as in DOM; may be relative). */
  linkHref: string | null;
  /** Present only for `<input>`, `<textarea>`, `<select>` host elements. */
  formControl: {
    kind: "input" | "textarea" | "select";
    inputType: string;
    name: string | null;
    placeholder: string | null;
  } | null;
  textSample: string;
  visible: boolean;
  /** Bounding rect in viewport/CSS pixels at capture time (see `stufeB.coordinateSpace`). */
  box: { x: number; y: number; width: number; height: number };
};

function pageUrl(slug: string): string {
  if (slug === "" || slug === "home") {
    return "/";
  }
  return `/${encodeURIComponent(slug)}`;
}

/** Comma-separated list; empty entries dropped; first occurrence wins. */
function dedupePreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Drop `null` / `undefined` entries (and empty objects) for smaller agent-facing JSON. */
function stripNullFields(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(stripNullFields);
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const next = stripNullFields(v);
      if (next === undefined) continue;
      if (typeof next === "object" && next !== null && !Array.isArray(next)) {
        if (Object.keys(next as Record<string, unknown>).length === 0) continue;
      }
      out[k] = next;
    }
    return out;
  }
  return value;
}

function parseIdList(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") {
    return [];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveSlugs(): string[] {
  const multi = parseIdList(process.env.PAGE_SLUGS);
  if (multi.length > 0) {
    return multi;
  }
  const single = (process.env.PAGE_SLUG ?? "home").trim() || "home";
  return [single];
}

function safeFileSegment(nodeId: string): string {
  return nodeId.replace(/[^\w-]+/g, "_").slice(0, 120) || "node";
}

function locatorForNodeId(page: Page, nodeId: string) {
  return page.locator(`[data-of-node-id=${JSON.stringify(nodeId)}]`).first();
}

async function capturePageReport(
  page: Page,
  testInfo: TestInfo,
  slug: string,
  focusNodeIds: string[],
): Promise<void> {
  const urlPath = pageUrl(slug);
  const skipShot =
    process.env.SKIP_SCREENSHOT === "1" || process.env.SKIP_SCREENSHOT === "true";
  const skipFullPage =
    process.env.SKIP_FULL_PAGE_SCREENSHOT === "1" ||
    process.env.SKIP_FULL_PAGE_SCREENSHOT === "true";

  const outDir = path.join(repoRoot, "artifacts", "page-reports");
  mkdirSync(outDir, { recursive: true });
  const baseName = slug.replace(/[^\w-]+/g, "_") || "page";

  const res = await page.goto(urlPath, { waitUntil: "load" });
  expect(res?.ok(), `goto ${urlPath} failed: ${res?.status()}`).toBeTruthy();

  await expect(page.locator('[data-of-node-id="root"]')).toBeVisible({ timeout: 15_000 });

  const evaluated = await page.evaluate((focusIds: string[]) => {
    const openframeChain = (el: Element): Element[] => {
      const rev: Element[] = [];
      let p: Element | null = el;
      while (p) {
        if (p.hasAttribute("data-of-node-id")) {
          rev.push(p);
        }
        p = p.parentElement;
      }
      return rev.reverse();
    };

    const all = [...document.querySelectorAll("[data-of-node-id]")];
    let els: Element[];

    if (focusIds.length > 0) {
      const attrMatch = (el: Element, id: string) =>
        el.getAttribute("data-of-node-id") === id;
      const missing = focusIds.filter(
        (id) => !all.some((el) => attrMatch(el, id)),
      );
      if (missing.length > 0) {
        throw new Error(
          `PAGE_FOCUS_NODE_IDS not found in DOM: ${missing.join(", ")}`,
        );
      }
      const focusRoots = focusIds
        .map((id) => all.find((el) => attrMatch(el, id))!)
        .filter(Boolean);
      const selectedSet = new Set<Element>();
      for (const el of all) {
        if (focusRoots.some((root) => root === el || root.contains(el))) {
          selectedSet.add(el);
        }
      }
      for (const fr of focusRoots) {
        let p: Element | null = fr;
        while (p) {
          if (p.hasAttribute("data-of-node-id")) {
            selectedSet.add(p);
          }
          p = p.parentElement;
        }
      }
      els = [...selectedSet];
    } else {
      els = all;
    }

    const rows = els.map((el): DomNodeRow => {
      const chain = openframeChain(el);
      const ids = chain.map((e) => e.getAttribute("data-of-node-id") ?? "");
      const pathStr = ids.join("/");
      const depth = Math.max(0, chain.length - 1);
      const parentNodeId =
        chain.length >= 2
          ? chain[chain.length - 2]!.getAttribute("data-of-node-id")
          : null;

      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        cs.visibility !== "hidden" &&
        cs.display !== "none" &&
        cs.opacity !== "0";
      let role = el.getAttribute("role");
      const tag = el.tagName.toLowerCase();
      if (!role) {
        if (tag === "button") role = "button";
        else if (tag === "a") role = "link";
        else if (tag === "nav") role = "navigation";
        else if (tag === "header") role = "banner";
        else if (tag === "section") role = "region";
        else if (tag === "img") role = "img";
        else if (/^h[1-6]$/.test(tag)) role = "heading";
      }

      let headingLevel: number | null = null;
      const hm = /^h([1-6])$/.exec(tag);
      if (hm) {
        headingLevel = parseInt(hm[1]!, 10);
      } else if (role === "heading") {
        const al = el.getAttribute("aria-level");
        if (al) {
          const n = parseInt(al, 10);
          if (n >= 1 && n <= 6) headingLevel = n;
        }
      }

      let linkHref: string | null = null;
      if (tag === "a") {
        const raw = el.getAttribute("href");
        linkHref = raw && raw.trim() ? raw.trim() : null;
      }

      let formControl: {
        kind: "input" | "textarea" | "select";
        inputType: string;
        name: string | null;
        placeholder: string | null;
      } | null = null;
      if (tag === "input") {
        const inp = el as HTMLInputElement;
        const name = inp.getAttribute("name");
        const ph = inp.getAttribute("placeholder");
        formControl = {
          kind: "input",
          inputType: inp.type || "text",
          name: name && name.trim() ? name.trim() : null,
          placeholder: ph && ph.trim() ? ph.trim() : null,
        };
      } else if (tag === "textarea") {
        const ta = el as HTMLTextAreaElement;
        const name = ta.getAttribute("name");
        const ph = ta.getAttribute("placeholder");
        formControl = {
          kind: "textarea",
          inputType: "textarea",
          name: name && name.trim() ? name.trim() : null,
          placeholder: ph && ph.trim() ? ph.trim() : null,
        };
      } else if (tag === "select") {
        const sel = el as HTMLSelectElement;
        const name = sel.getAttribute("name");
        formControl = {
          kind: "select",
          inputType: "select",
          name: name && name.trim() ? name.trim() : null,
          placeholder: null,
        };
      }

      const textSample = (el.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 280);
      const ariaLabel = el.getAttribute("aria-label");
      const title = el.getAttribute("title");
      const alt =
        el.tagName === "IMG"
          ? (el as HTMLImageElement).getAttribute("alt")
          : null;
      return {
        nodeId: el.getAttribute("data-of-node-id") ?? "",
        parentNodeId,
        depth,
        path: pathStr,
        tag,
        role: role ?? null,
        headingLevel,
        ariaLabel: ariaLabel && ariaLabel.trim() ? ariaLabel.trim() : null,
        title: title && title.trim() ? title.trim() : null,
        alt: alt && alt.trim() ? alt.trim() : null,
        linkHref,
        formControl,
        textSample,
        visible,
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    });

    return {
      rows,
      devicePixelRatio:
        typeof window.devicePixelRatio === "number" &&
        Number.isFinite(window.devicePixelRatio)
          ? window.devicePixelRatio
          : 1,
    };
  }, focusNodeIds);

  const reportRowFilter = dedupePreserveOrder(
    parseIdList(process.env.PAGE_REPORT_NODE_IDS),
  );
  const compactRows =
    process.env.PAGE_REPORT_COMPACT === "1" ||
    process.env.PAGE_REPORT_COMPACT === "true";

  let nodes = evaluated.rows;
  if (reportRowFilter.length > 0) {
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const missing = reportRowFilter.filter((id) => !byId.has(id));
    expect(
      missing,
      `PAGE_REPORT_NODE_IDS not in captured DOM (set PAGE_FOCUS_NODE_IDS if the node is outside the default slice): ${missing.join(", ")}`,
    ).toEqual([]);
    nodes = reportRowFilter.map((id) => byId.get(id)!);
  } else {
    nodes = nodes.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  }

  expect(nodes.length).toBeGreaterThan(0);
  if (reportRowFilter.length === 0) {
    expect(nodes.some((n) => n.nodeId === "root")).toBeTruthy();
  }

  const nodesForJson = compactRows
    ? nodes.map((row) => stripNullFields(row) as Record<string, unknown>)
    : nodes;

  const report = {
    slug,
    urlPath,
    fullUrl: new URL(
      urlPath,
      testInfo.project.use.baseURL ?? "http://localhost:3000",
    ).toString(),
    capturedAt: new Date().toISOString(),
    stufeB: {
      description:
        focusNodeIds.length === 0
          ? "Rendered DOM nodes with data-of-node-id. Each row includes tree path, inferred role, headingLevel (h1–h6 / aria-level), linkHref on anchors, formControl on input/textarea/select hosts, ARIA-ish labels, text sample."
          : "Focus slice under PAGE_FOCUS_NODE_IDS (see README). Same row fields as the full-page report.",
      coordinateSpace:
        "viewport" as const,
      devicePixelRatio: evaluated.devicePixelRatio,
      boxNote:
        "`box` is getBoundingClientRect() in CSS/layout pixels relative to the viewport origin (scroll-reflecting). Multiply by devicePixelRatio for rough physical pixels; full-page screenshots use a taller canvas than the viewport.",
      focusNodeIds: focusNodeIds.length > 0 ? focusNodeIds : undefined,
      reportNodeIds: reportRowFilter.length > 0 ? reportRowFilter : undefined,
      compactNullFields: compactRows ? true : undefined,
      nodeCount: nodesForJson.length,
      nodes: nodesForJson,
    },
    stufeC: {
      screenshot: null as string | null,
      fullPageSkippedReason: null as string | null,
      focusScreenshots: [] as { nodeId: string; relativePath: string }[],
    },
  };

  if (!skipShot) {
    if (skipFullPage && focusNodeIds.length === 0) {
      throw new Error(
        "SKIP_FULL_PAGE_SCREENSHOT=1 requires PAGE_FOCUS_NODE_IDS (or unset SKIP_FULL_PAGE_SCREENSHOT).",
      );
    }
    if (!skipFullPage) {
      const shotPath = path.join(outDir, `${baseName}-full.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      report.stufeC.screenshot = path.relative(repoRoot, shotPath);
    } else {
      report.stufeC.fullPageSkippedReason = "SKIP_FULL_PAGE_SCREENSHOT";
    }

    for (const nodeId of focusNodeIds) {
      const loc = locatorForNodeId(page, nodeId);
      await expect(loc, `focus node ${nodeId}`).toBeVisible({ timeout: 10_000 });
      await loc.scrollIntoViewIfNeeded();
      const focusPath = path.join(
        outDir,
        `${baseName}-focus-${safeFileSegment(nodeId)}.png`,
      );
      await loc.screenshot({ path: focusPath });
      report.stufeC.focusScreenshots.push({
        nodeId,
        relativePath: path.relative(repoRoot, focusPath),
      });
    }
  }

  const reportPath = path.join(outDir, `${baseName}-report.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  const focusNote =
    report.stufeC.focusScreenshots.length > 0
      ? ` focusPngs=${report.stufeC.focusScreenshots.length}`
      : "";
  console.log(
    `\n[page-visual-report] slug=${slug} nodes=${nodesForJson.length} report=${path.relative(repoRoot, reportPath)}` +
      (reportRowFilter.length ? ` rowFilter=${reportRowFilter.length}` : "") +
      (compactRows ? " compact=1" : "") +
      (report.stufeC.screenshot
        ? ` png=${report.stufeC.screenshot}`
        : skipShot
          ? " png=(skipped)"
          : report.stufeC.fullPageSkippedReason
            ? " pngFull=(skipped)"
            : "") +
      focusNote,
  );
}

const slugs = resolveSlugs();
const focusNodeIds = parseIdList(process.env.PAGE_FOCUS_NODE_IDS);
const reportRowIds = dedupePreserveOrder(
  parseIdList(process.env.PAGE_REPORT_NODE_IDS),
);

test.describe("Stufe B + C — page visual report", () => {
  for (const slug of slugs) {
    test(`capture DOM + screenshots — ${slug}${focusNodeIds.length ? ` (focus: ${focusNodeIds.join(", ")})` : ""}${reportRowIds.length ? ` [rows: ${reportRowIds.join(", ")}]` : ""}`, async ({
      page,
    }, testInfo) => {
      await capturePageReport(page, testInfo, slug, focusNodeIds);
    });
  }
});