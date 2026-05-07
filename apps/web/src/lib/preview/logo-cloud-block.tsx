import type { BlockProps } from "./block-shared";
import { FRAME_SURFACE_CLASS, type FrameSurface } from "./design-tokens";

export type LogoCloudItem = {
  name: string;
  src: string;
};

export type NormalizedLogoCloudProps = {
  surface: FrameSurface;
  title: string;
  logos: LogoCloudItem[];
};

const SURFACES: readonly FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent"];
export const LOGO_CLOUD_MAX_ITEMS = 24;
const MAX_NAME_LEN = 120;
const MAX_SRC_LEN = 2048;
const MAX_TITLE_LEN = 200;

function readSurface(v: unknown): FrameSurface {
  const s = typeof v === "string" ? v : "";
  return (SURFACES as readonly string[]).includes(s) ? (s as FrameSurface) : "default";
}

function trimSlice(raw: unknown, max: number): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  return s.length <= max ? s : s.slice(0, max);
}

function readLogos(raw: unknown): LogoCloudItem[] {
  if (!Array.isArray(raw)) {
    return [{ name: "OpenFrame", src: "" }];
  }
  const out: LogoCloudItem[] = [];
  for (const el of raw) {
    if (out.length >= LOGO_CLOUD_MAX_ITEMS) {
      break;
    }
    if (!el || typeof el !== "object") {
      continue;
    }
    const o = el as Record<string, unknown>;
    const name = trimSlice(o.name, MAX_NAME_LEN);
    const src = trimSlice(o.src, MAX_SRC_LEN);
    if (name === "") {
      continue;
    }
    out.push({ name, src });
  }
  return out.length > 0 ? out : [{ name: "OpenFrame", src: "" }];
}

export function normalizeLogoCloudProps(props: Record<string, unknown>): NormalizedLogoCloudProps {
  return {
    surface: readSurface(props.surface),
    title: trimSlice(props.title, MAX_TITLE_LEN),
    logos: readLogos(props.logos),
  };
}

export function defaultLogoCloudPropsRecord(): Record<string, unknown> {
  return {
    surface: "default",
    title: "Trusted by teams building with OpenFrame",
    logos: [
      { name: "OpenFrame", src: "" },
      { name: "Acme", src: "" },
      { name: "Northstar", src: "" },
      { name: "Pixel Labs", src: "" },
    ],
  };
}

export function LogoCloudBlock({ node }: BlockProps) {
  const p = normalizeLogoCloudProps(node.props);
  return (
    <section data-of-node-id={node.id} className={`min-w-0 rounded-xl p-5 ${FRAME_SURFACE_CLASS[p.surface]}`}>
      {p.title !== "" ? <p className="mb-4 text-sm font-medium text-inherit opacity-85">{p.title}</p> : null}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {p.logos.map((logo, i) => (
          <div key={i} className="flex min-h-12 items-center justify-center rounded-lg border border-zinc-300/50 bg-white/40 px-3 py-2">
            {logo.src !== "" ? (
              <img src={logo.src} alt={logo.name} className="max-h-7 w-auto object-contain" />
            ) : (
              <span className="truncate text-sm font-semibold text-inherit opacity-85">{logo.name}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
