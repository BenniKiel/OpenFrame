import type { BlockProps } from "./block-shared";
import { FRAME_SURFACE_CLASS, type FrameSurface } from "./design-tokens";

export type NavHeaderLink = {
  label: string;
  href: string;
};

export type NormalizedNavHeaderProps = {
  surface: FrameSurface;
  logoLabel: string;
  logoHref: string;
  links: NavHeaderLink[];
  ctaLabel: string;
  ctaHref: string;
};

const SURFACES: readonly FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent", "glass"];
export const NAV_HEADER_MAX_LINKS = 8;
const MAX_TEXT = 120;
const MAX_HREF = 2048;

function readSurface(v: unknown): FrameSurface {
  const s = typeof v === "string" ? v : "";
  return (SURFACES as readonly string[]).includes(s) ? (s as FrameSurface) : "default";
}

function trimSlice(raw: unknown, max: number): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  return s.length <= max ? s : s.slice(0, max);
}

function readLinks(raw: unknown): NavHeaderLink[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: NavHeaderLink[] = [];
  for (const el of raw) {
    if (out.length >= NAV_HEADER_MAX_LINKS) {
      break;
    }
    if (!el || typeof el !== "object") {
      continue;
    }
    const o = el as Record<string, unknown>;
    const label = trimSlice(o.label, MAX_TEXT);
    const href = trimSlice(o.href, MAX_HREF);
    if (label === "" || href === "") {
      continue;
    }
    out.push({ label, href });
  }
  return out;
}

export function normalizeNavHeaderProps(props: Record<string, unknown>): NormalizedNavHeaderProps {
  return {
    surface: readSurface(props.surface),
    logoLabel: trimSlice(props.logoLabel, MAX_TEXT) || "OpenFrame",
    logoHref: trimSlice(props.logoHref, MAX_HREF) || "/",
    links: readLinks(props.links),
    ctaLabel: trimSlice(props.ctaLabel, MAX_TEXT),
    ctaHref: trimSlice(props.ctaHref, MAX_HREF),
  };
}

export function defaultNavHeaderPropsRecord(): Record<string, unknown> {
  return {
    surface: "default",
    logoLabel: "OpenFrame",
    logoHref: "/",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
    ctaLabel: "Start free",
    ctaHref: "#cta",
  };
}

export function NavHeaderBlock({ node }: BlockProps) {
  const p = normalizeNavHeaderProps(node.props);

  return (
    <header data-of-node-id={node.id} className={`min-w-0 rounded-xl px-4 py-3 ${FRAME_SURFACE_CLASS[p.surface]}`}>
      <div className="flex flex-wrap items-center gap-3">
        <a href={p.logoHref} className="font-semibold text-inherit no-underline">
          {p.logoLabel}
        </a>
        <nav className="ml-auto flex flex-wrap items-center gap-3" aria-label="Primary">
          {p.links.map((link, i) => (
            <a key={i} href={link.href} className="text-sm text-inherit opacity-85 no-underline hover:opacity-100">
              {link.label}
            </a>
          ))}
          {p.ctaLabel !== "" && p.ctaHref !== "" ? (
            <a
              href={p.ctaHref}
              className="rounded-md border border-zinc-300/70 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white no-underline"
            >
              {p.ctaLabel}
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
