import { parsePageDocument } from "@/lib/openframe";
import type { OpenframePageDocument } from "@/lib/openframe";

const raw = {
  version: 1 as const,
  root: {
    id: "root",
    type: "container",
    props: {},
    children: [
      {
        id: "intro",
        type: "text",
        props: {
          text: "Preview: add ?slug=your-page to load from the database after pnpm db:push.",
        },
        children: [],
      },
    ],
  },
} as const;

const parsed = parsePageDocument(raw);
if (!parsed.ok) {
  throw new Error("DEFAULT_PREVIEW_DOCUMENT failed validation");
}

/** Validated fallback tree for the draft preview frame before the editor sends a real document. */
export const DEFAULT_PREVIEW_DOCUMENT: OpenframePageDocument = parsed.data;
