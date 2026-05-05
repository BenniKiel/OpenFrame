"use client";

import { useRef, useEffect, useState } from "react";

import { DEFAULT_PREVIEW_DOCUMENT } from "@/lib/preview/default-document";
import {
  handleDraftMessageEvent,
  OPENFRAME_PREVIEW_CONTENT_SIZE_TYPE,
} from "@/lib/preview/draft-protocol";
import {
  OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE,
  OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE,
  isPinchZoomWheelEvent,
  normalizeWheelPixelDeltas,
  wheelCanScrollNativeChain,
} from "@/lib/preview/preview-wheel-bridge";
import { pageShellClassNames } from "@/lib/preview/page-theme";
import { renderPageDocument } from "@/lib/preview/render-page-document";
import type { OpenframePageDocument } from "@/lib/openframe";

/**
 * Client-only preview for `?draft=1`: renders postMessage payloads after `parsePageDocument`.
 */
export function DraftPreviewFrame() {
  const [doc, setDoc] = useState<OpenframePageDocument>(DEFAULT_PREVIEW_DOCUMENT);
  const [lastError, setLastError] = useState<string | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allowedOrigin = window.location.origin;

    function onMessage(ev: MessageEvent) {
      const r = handleDraftMessageEvent(ev, allowedOrigin);
      if (r.kind === "ignored") {
        return;
      }
      if (r.kind === "invalid") {
        setLastError(r.message);
        return;
      }
      setDoc(r.document);
      setLastError(null);

      if (typeof ev.data.viewportHeight === "number") {
        document.documentElement.style.setProperty("--openframe-vh", `${ev.data.viewportHeight / 100}px`);
      }
      if (typeof ev.data.viewportWidth === "number") {
        document.documentElement.style.setProperty("--openframe-vw", `${ev.data.viewportWidth / 100}px`);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  /** Report content height to the editor parent for “fit canvas height” mode. */
  useEffect(() => {
    const allowedOrigin = window.location.origin;
    const el = measureRef.current;
    if (!el) {
      return;
    }

    const postHeight = () => {
      const node = measureRef.current;
      if (!node) {
        return;
      }
      /** Intrinsic block-axis size of the page tree only — not the iframe `innerHeight` chain. */
      const h = Math.ceil(node.scrollHeight);
      window.parent.postMessage(
        { type: OPENFRAME_PREVIEW_CONTENT_SIZE_TYPE, payload: { height: h } } as const,
        allowedOrigin,
      );
    };

    const ro = new ResizeObserver(() => {
      queueMicrotask(postHeight);
    });
    ro.observe(el);
    queueMicrotask(postHeight);

    return () => ro.disconnect();
  }, [doc, lastError]);

  /** Bridge wheel / pinch to the editor when native scrolling would not consume them (e.g. over plain text). */
  useEffect(() => {
    const allowedOrigin = window.location.origin;

    const postWheel = (e: WheelEvent) => {
      const msg = {
        type: OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE,
        payload: {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaMode: e.deltaMode,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
        },
      } as const;
      window.parent.postMessage(msg, allowedOrigin);
    };

    const onWheelCapture = (e: WheelEvent) => {
      const { dx, dy } = normalizeWheelPixelDeltas(
        e.deltaX,
        e.deltaY,
        e.deltaMode,
        window.innerWidth,
        window.innerHeight,
      );

      if (isPinchZoomWheelEvent(e)) {
        e.preventDefault();
        postWheel(e);
        return;
      }

      if (wheelCanScrollNativeChain(e.target, dx, dy)) {
        return;
      }

      e.preventDefault();
      postWheel(e);
    };

    document.addEventListener("wheel", onWheelCapture, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", onWheelCapture, true);
  }, []);

  useEffect(() => {
    const allowedOrigin = window.location.origin;
    if (!("GestureEvent" in globalThis)) {
      return;
    }

    type Ge = Event & { readonly scale: number };

    const post = (payload: { phase: "start" } | { phase: "change"; scale: number } | { phase: "end" }) => {
      window.parent.postMessage(
        { type: OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE, payload },
        allowedOrigin,
      );
    };

    const onGestureStart = (e: Event) => {
      e.preventDefault();
      post({ phase: "start" });
    };

    const onGestureChange = (e: Event) => {
      const ge = e as Ge;
      e.preventDefault();
      post({ phase: "change", scale: ge.scale });
    };

    const onGestureEnd = (e: Event) => {
      e.preventDefault();
      post({ phase: "end" });
    };

    document.addEventListener("gesturestart", onGestureStart, { capture: true, passive: false });
    document.addEventListener("gesturechange", onGestureChange, { capture: true, passive: false });
    document.addEventListener("gestureend", onGestureEnd, { capture: true, passive: false });
    return () => {
      document.removeEventListener("gesturestart", onGestureStart, true);
      document.removeEventListener("gesturechange", onGestureChange, true);
      document.removeEventListener("gestureend", onGestureEnd, true);
    };
  }, []);

  return (
    <div ref={measureRef} className={pageShellClassNames(doc.theme)}>
      {lastError ? (
        <div className="fixed top-0 left-0 right-0 z-50 p-3">
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900 shadow-md">
            Invalid draft payload (kept last good render): {lastError}
          </p>
        </div>
      ) : null}
      {renderPageDocument(doc)}
    </div>
  );
}
