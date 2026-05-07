import type { BlockProps } from "./block-shared";
import { FRAME_SURFACE_CLASS, type FrameSurface } from "./design-tokens";

export type NormalizedTestimonialProps = {
  surface: FrameSurface;
  quote: string;
  author: string;
  role: string;
  avatarSrc: string | null;
};

const SURFACES: readonly FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent"];
const MAX_QUOTE_LEN = 2000;
const MAX_AUTHOR_LEN = 200;
const MAX_ROLE_LEN = 200;
const MAX_AVATAR_LEN = 2048;

function readSurface(v: unknown): FrameSurface {
  const s = typeof v === "string" ? v : "";
  return (SURFACES as readonly string[]).includes(s) ? (s as FrameSurface) : "default";
}

function trimSlice(raw: unknown, max: number): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  return s.length <= max ? s : s.slice(0, max);
}

export function normalizeTestimonialProps(props: Record<string, unknown>): NormalizedTestimonialProps {
  const avatarRaw = trimSlice(props.avatarSrc, MAX_AVATAR_LEN);
  return {
    surface: readSurface(props.surface),
    quote: trimSlice(props.quote, MAX_QUOTE_LEN),
    author: trimSlice(props.author, MAX_AUTHOR_LEN),
    role: trimSlice(props.role, MAX_ROLE_LEN),
    avatarSrc: avatarRaw === "" ? null : avatarRaw,
  };
}

export function defaultTestimonialPropsRecord(): Record<string, unknown> {
  return {
    surface: "default",
    quote: "OpenFrame helped us ship our landing pages from one canonical document in under a day.",
    author: "Alex Rivera",
    role: "Product Lead, ExampleCo",
    avatarSrc: "",
  };
}

export function TestimonialBlock({ node }: BlockProps) {
  const p = normalizeTestimonialProps(node.props);
  return (
    <figure data-of-node-id={node.id} className={`min-w-0 rounded-xl p-5 ${FRAME_SURFACE_CLASS[p.surface]}`}>
      <blockquote className="text-lg leading-relaxed text-inherit">
        {p.quote !== "" ? p.quote : "Quote"}
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        {p.avatarSrc ? (
          <img src={p.avatarSrc} alt={p.author || "Author"} className="h-10 w-10 rounded-full object-cover ring-1 ring-black/10" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-300/40 text-xs font-semibold uppercase text-inherit">
            {(p.author || "?").slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate font-semibold text-inherit">{p.author !== "" ? p.author : "Author"}</div>
          {p.role !== "" ? <div className="truncate text-sm text-inherit opacity-80">{p.role}</div> : null}
        </div>
      </figcaption>
    </figure>
  );
}
