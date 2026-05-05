/** Wheel deltas forwarded from the draft preview iframe → editor (same-origin). */
export const OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE = "openframe:preview-wheel-bridge.v1" as const;

/** Safari pinch phases forwarded from the draft iframe → editor. */
export const OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE = "openframe:preview-pinch-bridge.v1" as const;

export type PreviewWheelBridgePayload = {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
  metaKey: boolean;
};

export type PreviewWheelBridgeMessage = {
  type: typeof OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE;
  payload: PreviewWheelBridgePayload;
};

export type PreviewPinchBridgePayload =
  | { phase: "start" }
  | { phase: "change"; scale: number }
  | { phase: "end" };

export type PreviewPinchBridgeMessage = {
  type: typeof OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE;
  payload: PreviewPinchBridgePayload;
};

export function isPreviewWheelBridgeMessage(data: unknown): data is PreviewWheelBridgeMessage {
  if (typeof data !== "object" || data === null || !("type" in data) || !("payload" in data)) {
    return false;
  }
  if ((data as { type: unknown }).type !== OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE) {
    return false;
  }
  const p = (data as { payload: unknown }).payload;
  if (typeof p !== "object" || p === null) {
    return false;
  }
  const o = p as Record<string, unknown>;
  return (
    typeof o.deltaX === "number" &&
    typeof o.deltaY === "number" &&
    typeof o.deltaMode === "number" &&
    typeof o.ctrlKey === "boolean" &&
    typeof o.metaKey === "boolean"
  );
}

export function isPreviewPinchBridgeMessage(data: unknown): data is PreviewPinchBridgeMessage {
  if (typeof data !== "object" || data === null || !("type" in data) || !("payload" in data)) {
    return false;
  }
  if ((data as { type: unknown }).type !== OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE) {
    return false;
  }
  const p = (data as { payload: unknown }).payload;
  if (typeof p !== "object" || p === null || !("phase" in p)) {
    return false;
  }
  const phase = (p as { phase: unknown }).phase;
  if (phase === "start" || phase === "end") {
    return true;
  }
  if (phase === "change" && typeof (p as { scale?: unknown }).scale === "number") {
    return true;
  }
  return false;
}

export function normalizeWheelPixelDeltas(
  deltaX: number,
  deltaY: number,
  deltaMode: number,
  viewportW: number | null,
  viewportH: number | null,
): { dx: number; dy: number } {
  let dx = deltaX;
  let dy = deltaY;
  if (deltaMode === 1) {
    /* DOM_DELTA_LINE */
    dx *= 16;
    dy *= 16;
  } else if (deltaMode === 2 && viewportW !== null && viewportH !== null) {
    /* DOM_DELTA_PAGE */
    dx *= viewportW * 0.85;
    dy *= viewportH * 0.85;
  }
  return { dx, dy };
}

export function isPinchZoomWheelFlags(ctrlKey: boolean, metaKey: boolean): boolean {
  return ctrlKey || metaKey;
}

export function isPinchZoomWheelEvent(e: WheelEvent): boolean {
  if (e.ctrlKey || e.metaKey) {
    return true;
  }
  try {
    if (e.getModifierState("Control") || e.getModifierState("Meta")) {
      return true;
    }
  } catch {
    /* noop */
  }
  return false;
}

const OVERFLOW_SCROLL = new Set(["auto", "scroll", "overlay"]);

function eventTargetToHTMLElement(target: EventTarget | null): HTMLElement | null {
  if (!target) {
    return null;
  }
  if (target instanceof HTMLElement) {
    return target;
  }
  if (target instanceof Text) {
    return target.parentElement instanceof HTMLElement ? target.parentElement : null;
  }
  if (target instanceof Element) {
    let n: Element | null = target;
    while (n && !(n instanceof HTMLElement)) {
      n = n.parentElement;
    }
    return n as HTMLElement | null;
  }
  return null;
}

function overflowScrollableY(el: HTMLElement): boolean {
  const st = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!st) {
    return false;
  }
  return OVERFLOW_SCROLL.has(st.overflowY) && el.scrollHeight > el.clientHeight + 1;
}

function overflowScrollableX(el: HTMLElement): boolean {
  const st = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!st) {
    return false;
  }
  return OVERFLOW_SCROLL.has(st.overflowX) && el.scrollWidth > el.clientWidth + 1;
}

function canScrollY(el: HTMLElement, dy: number): boolean {
  if (!overflowScrollableY(el)) {
    return false;
  }
  const max = el.scrollHeight - el.clientHeight;
  if (dy > 0 && el.scrollTop < max - 0.5) {
    return true;
  }
  if (dy < 0 && el.scrollTop > 0.5) {
    return true;
  }
  return false;
}

function canScrollX(el: HTMLElement, dx: number): boolean {
  if (!overflowScrollableX(el)) {
    return false;
  }
  const max = el.scrollWidth - el.clientWidth;
  if (dx > 0 && el.scrollLeft < max - 0.5) {
    return true;
  }
  if (dx < 0 && el.scrollLeft > 0.5) {
    return true;
  }
  return false;
}

/**
 * True if the wheel event should stay in the iframe (native scroll) instead of
 * being bridged to the editor canvas pan/zoom.
 */
export function wheelCanScrollNativeChain(target: EventTarget | null, dx: number, dy: number): boolean {
  const start = eventTargetToHTMLElement(target);
  if (!start) {
    return false;
  }
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const vert = absDy >= absDx;
  const horiz = absDx > absDy;

  for (let el: HTMLElement | null = start; el; el = el.parentElement) {
    if (vert && canScrollY(el, dy)) {
      return true;
    }
    if (horiz && canScrollX(el, dx)) {
      return true;
    }
  }
  return false;
}
