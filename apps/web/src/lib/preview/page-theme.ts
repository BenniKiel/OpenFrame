import type { PageTheme } from "@/lib/openframe";

const RADIUS_CLASS: Record<NonNullable<PageTheme["radius"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

/** Public + draft preview: outer shell around `renderPageDocument`. */
export function pageShellClassNames(theme: PageTheme | undefined): string {
  const t = theme ?? {};
  const parts: string[] = ["min-h-dvh", "flex", "flex-col"];

  if (t.colorScheme === "dark") {
    parts.push("bg-zinc-950", "text-zinc-50");
  } else {
    parts.push("bg-white", "text-zinc-900");
  }

  if (t.radius) {
    parts.push(RADIUS_CLASS[t.radius]);
  }

  if (t.typographyScale === "large") {
    parts.push("text-lg");
  }

  return parts.join(" ");
}
