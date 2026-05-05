import { parsePageDocument, type OpenframePageDocument } from "@/lib/openframe";

const raw = {
  version: 1 as const,
  root: {
    id: "root",
    type: "container",
    name: "Page",
    props: {},
    children: [
      {
        id: "welcome",
        type: "text",
        name: "Welcome",
        props: { text: "New page — save to persist." },
        children: [],
      },
    ],
  },
} as const;

const parsed = parsePageDocument(raw);
if (!parsed.ok) {
  throw new Error("starter document failed validation");
}
const starterDocument: OpenframePageDocument = parsed.data;

/** Valid default tree when `GET /api/pages/:slug` returns 404 (new page). */
export function getStarterPageDocument(): OpenframePageDocument {
  return starterDocument;
}
