import type { PageNode } from "@/lib/openframe";

/** First line of clipboard text; entire payload is marker + newline + JSON */
export const OPENFRAME_LAYER_CLIPBOARD_MARK = "openframe:layer:v1";

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Encode a subtree for `text/plain` clipboard (paste across tabs / plain-text tools). */
export function encodeLayerClipboard(node: PageNode): string {
  const plain = JSON.parse(JSON.stringify(node)) as PageNode;
  return `${OPENFRAME_LAYER_CLIPBOARD_MARK}\n${JSON.stringify(plain)}`;
}

/** Parse clipboard text into a node, or null if not OpenFrame layer data. */
export function decodeLayerClipboard(text: string): PageNode | null {
  const t = stripBom(text).trimStart();
  const nl = t.indexOf("\n");
  if (nl < 0) {
    return null;
  }
  const first = t.slice(0, nl).trim();
  if (first !== OPENFRAME_LAYER_CLIPBOARD_MARK) {
    return null;
  }
  const jsonPart = t.slice(nl + 1);
  try {
    return JSON.parse(jsonPart) as PageNode;
  } catch {
    return null;
  }
}
