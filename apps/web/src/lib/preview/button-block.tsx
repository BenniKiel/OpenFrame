import type { BlockProps } from "./block-shared";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type NormalizedButtonProps = {
  label: string;
  href: string | null;
  variant: ButtonVariant;
};

const VARIANTS: readonly ButtonVariant[] = ["primary", "secondary", "ghost"];

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-zinc-500",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 focus-visible:outline-zinc-400",
  ghost: "text-zinc-800 hover:bg-zinc-100/80 focus-visible:outline-zinc-400",
};

function readLabel(v: unknown): string {
  if (typeof v === "string" && v.length > 0) {
    return v;
  }
  return "Button";
}

function readOptionalHref(v: unknown): string | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "string" && v.trim() === "") {
    return null;
  }
  if (typeof v === "string") {
    return v;
  }
  return null;
}

export function normalizeButtonProps(props: Record<string, unknown>): NormalizedButtonProps {
  const label = readLabel(props.label);
  const href = readOptionalHref(props.href);
  const raw = typeof props.variant === "string" ? props.variant : "";
  const variant: ButtonVariant = (VARIANTS as readonly string[]).includes(raw) ? (raw as ButtonVariant) : "primary";
  return { label, href, variant };
}

export function defaultButtonPropsRecord(): Record<string, unknown> {
  return {
    label: "Button",
    href: null,
    variant: "primary",
  };
}

export function ButtonBlock({ node }: BlockProps) {
  const p = normalizeButtonProps(node.props);
  const cls = `${BTN_BASE} ${VARIANT_CLASS[p.variant]}`;

  if (p.href) {
    return (
      <a data-of-node-id={node.id} className={cls} href={p.href}>
        {p.label}
      </a>
    );
  }

  return (
    <button type="button" data-of-node-id={node.id} className={cls}>
      {p.label}
    </button>
  );
}
