import { parsePageDocument, type OpenframePageDocument } from "@/lib/openframe";
import type { ZodError } from "zod";

export const OPENFRAME_PREVIEW_CONTENT_SIZE_TYPE = "openframe:preview-content-size.v1" as const;

export type PreviewContentSizeMessage = {
  type: typeof OPENFRAME_PREVIEW_CONTENT_SIZE_TYPE;
  payload: { height: number };
};

export function isPreviewContentSizeMessage(data: unknown): data is PreviewContentSizeMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as { type?: unknown }).type === OPENFRAME_PREVIEW_CONTENT_SIZE_TYPE &&
    "payload" in data
  );
}

/** Stable envelope type for v1 draft document sync over postMessage. */
export const OPENFRAME_DRAFT_MESSAGE_TYPE = "openframe:draft-document.v1" as const;

export type DraftDocumentMessage = {
  type: typeof OPENFRAME_DRAFT_MESSAGE_TYPE;
  payload: unknown;
  viewportHeight?: number;
  /** Logical breakpoint width (px) — keeps `vw` / layout width aligned with the scaled editor chrome. */
  viewportWidth?: number;
};

export function isDraftDocumentMessage(data: unknown): data is DraftDocumentMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as { type?: unknown }).type === OPENFRAME_DRAFT_MESSAGE_TYPE &&
    "payload" in data
  );
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`)
    .join(" · ");
}

export type DraftMessageResult =
  | { kind: "ignored" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; document: OpenframePageDocument };

/**
 * Validates a MessageEvent for same-origin draft sync. Wrong origin or envelope → ignored.
 */
export function handleDraftMessageEvent(ev: MessageEvent, allowedOrigin: string): DraftMessageResult {
  if (ev.origin !== allowedOrigin) {
    return { kind: "ignored" };
  }
  if (!isDraftDocumentMessage(ev.data)) {
    return { kind: "ignored" };
  }
  const parsed = parsePageDocument(ev.data.payload);
  if (!parsed.ok) {
    return { kind: "invalid", message: formatZodError(parsed.error) };
  }
  return { kind: "ok", document: structuredClone(parsed.data) };
}

/**
 * Sends a validated canonical document to the draft preview iframe. No-op if iframe or origin missing.
 */
export function postDraftToPreview(
  iframe: HTMLIFrameElement | null,
  doc: OpenframePageDocument,
  targetOrigin: string,
  viewportHeight?: number,
  viewportWidth?: number,
): void {
  if (!iframe?.contentWindow || !targetOrigin) {
    return;
  }
  const validated = parsePageDocument(doc);
  if (!validated.ok) {
    return;
  }
  const message: DraftDocumentMessage = {
    type: OPENFRAME_DRAFT_MESSAGE_TYPE,
    payload: validated.data,
    viewportHeight,
    viewportWidth,
  };
  iframe.contentWindow.postMessage(message, targetOrigin);
}
