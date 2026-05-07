import type { BlockProps } from "./block-shared";
import { FRAME_SURFACE_CLASS, type FrameSurface } from "./design-tokens";

export type FaqItem = {
  question: string;
  answer: string;
};

export type NormalizedFaqProps = {
  surface: FrameSurface;
  items: FaqItem[];
};

const SURFACES: readonly FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent"];

/** Exported for editor caps — keep in sync with `readItems`. */
export const FAQ_MAX_ITEMS = 32;
const MAX_QUESTION_LEN = 500;
const MAX_ANSWER_LEN = 4000;

function readSurface(v: unknown): FrameSurface {
  const s = typeof v === "string" ? v : "";
  return (SURFACES as readonly string[]).includes(s) ? (s as FrameSurface) : "default";
}

function trimSlice(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max);
}

function readItems(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) {
    return [{ question: "", answer: "" }];
  }
  const out: FaqItem[] = [];
  for (const el of raw) {
    if (out.length >= FAQ_MAX_ITEMS) {
      break;
    }
    if (!el || typeof el !== "object") {
      continue;
    }
    const o = el as Record<string, unknown>;
    const hasQ = typeof o.question === "string";
    const hasA = typeof o.answer === "string";
    if (!hasQ && !hasA) {
      continue;
    }
    const q = hasQ ? trimSlice(o.question as string, MAX_QUESTION_LEN) : "";
    const a = hasA ? trimSlice(o.answer as string, MAX_ANSWER_LEN) : "";
    out.push({ question: q, answer: a });
  }
  return out.length > 0 ? out : [{ question: "", answer: "" }];
}

export function normalizeFaqProps(props: Record<string, unknown>): NormalizedFaqProps {
  return {
    surface: readSurface(props.surface),
    items: readItems(props.items),
  };
}

export function defaultFaqPropsRecord(): Record<string, unknown> {
  return {
    surface: "default",
    items: [
      { question: "What is OpenFrame?", answer: "A structured page format with a visual editor and live preview." },
      { question: "Where is content stored?", answer: "In the canonical JSON document for each page." },
    ],
  };
}

export function FaqBlock({ node }: BlockProps) {
  const p = normalizeFaqProps(node.props);

  const divide =
    p.surface === "inverse" ? "divide-white/15" : p.surface === "transparent" ? "divide-zinc-200/60" : "divide-zinc-200/90";

  return (
    <div data-of-node-id={node.id} className={`min-w-0 divide-y rounded-xl ${divide} ${FRAME_SURFACE_CLASS[p.surface]}`}>
      {p.items.map((item, i) => (
        <details key={i} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
          <summary className="cursor-pointer list-none font-medium text-inherit marker:content-none group-open:mb-2">
            {item.question.trim() !== "" ? item.question : `Item ${i + 1}`}
          </summary>
          <div className="text-[15px] leading-relaxed text-inherit opacity-90">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
