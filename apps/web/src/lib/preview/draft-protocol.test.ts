import { describe, expect, it } from "vitest";

import { parsePageDocument } from "@/lib/openframe";

import {
  OPENFRAME_DRAFT_MESSAGE_TYPE,
  handleDraftMessageEvent,
  isDraftDocumentMessage,
  postDraftToPreview,
} from "./draft-protocol";

const validDoc = {
  version: 1 as const,
  root: {
    id: "root",
    type: "container",
    props: {},
    children: [],
  },
};

describe("isDraftDocumentMessage", () => {
  it("accepts v1 envelope", () => {
    expect(
      isDraftDocumentMessage({
        type: OPENFRAME_DRAFT_MESSAGE_TYPE,
        payload: validDoc,
      }),
    ).toBe(true);
  });

  it("rejects other types", () => {
    expect(isDraftDocumentMessage({ type: "other", payload: validDoc })).toBe(false);
  });
});

describe("handleDraftMessageEvent", () => {
  it("ignores wrong origin", () => {
    const ev = new MessageEvent("message", {
      origin: "https://evil.example",
      data: { type: OPENFRAME_DRAFT_MESSAGE_TYPE, payload: validDoc },
    });
    expect(handleDraftMessageEvent(ev, "http://localhost:3000").kind).toBe("ignored");
  });

  it("accepts same origin and valid payload", () => {
    const origin = "http://localhost:3000";
    const parsed = parsePageDocument(validDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const ev = new MessageEvent("message", {
      origin,
      data: { type: OPENFRAME_DRAFT_MESSAGE_TYPE, payload: parsed.data },
    });
    const r = handleDraftMessageEvent(ev, origin);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.document.version).toBe(1);
    }
  });

  it("returns invalid for bad payload", () => {
    const origin = "http://localhost:3000";
    const ev = new MessageEvent("message", {
      origin,
      data: {
        type: OPENFRAME_DRAFT_MESSAGE_TYPE,
        payload: { version: 99, root: validDoc.root },
      },
    });
    const r = handleDraftMessageEvent(ev, origin);
    expect(r.kind).toBe("invalid");
  });
});

describe("postDraftToPreview", () => {
  it("posts validated message to contentWindow", () => {
    const origin = "http://localhost:3000";
    const posted: unknown[] = [];
    const iframe = {
      contentWindow: {
        postMessage: (msg: unknown, target: string) => {
          posted.push({ msg, target });
        },
      },
    } as unknown as HTMLIFrameElement;

    const parsed = parsePageDocument(validDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    postDraftToPreview(iframe, parsed.data, origin);
    expect(posted).toHaveLength(1);
    expect((posted[0] as { target: string }).target).toBe(origin);
    expect((posted[0] as { msg: { type: string } }).msg.type).toBe(OPENFRAME_DRAFT_MESSAGE_TYPE);
  });

  it("includes viewport height and width when provided", () => {
    const origin = "http://localhost:3000";
    const posted: unknown[] = [];
    const iframe = {
      contentWindow: {
        postMessage: (msg: unknown, target: string) => {
          posted.push({ msg, target });
        },
      },
    } as unknown as HTMLIFrameElement;

    const parsed = parsePageDocument(validDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    postDraftToPreview(iframe, parsed.data, origin, 1080, 1920);
    const msg = (posted[0] as { msg: { viewportHeight?: number; viewportWidth?: number } }).msg;
    expect(msg.viewportHeight).toBe(1080);
    expect(msg.viewportWidth).toBe(1920);
  });
});
