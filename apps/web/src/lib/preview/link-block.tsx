import type { BlockProps } from "./block-shared";

export type NormalizedLinkProps = {
  href: string;
  label: string;
  external: boolean;
};

function readString(v: unknown, fallback: string): string {
  if (typeof v === "string") {
    return v;
  }
  return fallback;
}

export function normalizeLinkProps(props: Record<string, unknown>): NormalizedLinkProps {
  const href = readString(props.href, "#");
  const label = readString(props.label, "Link");
  const external = Boolean(props.external);
  return { href, label, external };
}

export function defaultLinkPropsRecord(): Record<string, unknown> {
  return {
    href: "https://",
    label: "Link",
    external: true,
  };
}

export function LinkBlock({ node }: BlockProps) {
  const p = normalizeLinkProps(node.props);
  const rel = p.external ? "noopener noreferrer" : undefined;
  const target = p.external ? "_blank" : undefined;
  return (
    <a
      data-of-node-id={node.id}
      className="text-sm font-medium text-sky-600 underline decoration-sky-600/30 underline-offset-2 transition-colors hover:text-sky-700"
      href={p.href}
      rel={rel}
      target={target}
    >
      {p.label}
    </a>
  );
}
