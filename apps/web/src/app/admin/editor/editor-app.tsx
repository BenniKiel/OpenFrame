"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  buildNodeMaps,
  canParentAcceptChild,
  decodeLayerClipboard,
  findNodeById,
  flattenVisibleTree,
  getDisplayLayerName,
  getLayerNamePlaceholder,
  useEditorStore,
  type EditorChildKind,
  type TreeDndRow,
  type TreeDndSlot,
} from "@/lib/editor";
import { useTreeDnd } from "@/lib/editor/use-tree-dnd";
import { type PageNode, type PageTheme } from "@/lib/openframe";
import { isSafePageSlug } from "@/lib/persistence/slug";
import { isPreviewContentSizeMessage, postDraftToPreview } from "@/lib/preview";
import { AXIS_SIZE_MODES, type AxisSizeMode } from "@/lib/preview/axis-size-mode";
import { normalizeButtonProps, type ButtonVariant } from "@/lib/preview/button-block";
import { normalizeCardProps } from "@/lib/preview/card-block";
import { FAQ_MAX_ITEMS, normalizeFaqProps, type FaqItem } from "@/lib/preview/faq-block";
import { normalizeContainerProps, type ContainerHeightMode } from "@/lib/preview/container-block";
import {
  CONTAINER_SURFACE_CLASS,
  type CursorToken,
  type FrameSurface,
  type LeadingToken,
  type SizeUnit,
  type TextTone,
  type TrackingToken,
} from "@/lib/preview/design-tokens";
import { normalizeFrameFill } from "@/lib/preview/frame-fill";
import { normalizeFrameProps, type FrameDirection, type FrameLayoutType } from "@/lib/preview/frame-block";
import { FRAME_BREAKPOINT_MIN_PX, mergeFrameWhenBreakpoint, type FrameBreakpointKey } from "@/lib/preview/frame-responsive";
import { normalizeHeadingProps, type HeadingSizeScale } from "@/lib/preview/heading-block";
import { normalizeImageProps, type ImageDimensionUnit, type ImageFit } from "@/lib/preview/image-block";
import { normalizeLinkProps } from "@/lib/preview/link-block";
import { LOGO_CLOUD_MAX_ITEMS, normalizeLogoCloudProps, type LogoCloudItem } from "@/lib/preview/logo-cloud-block";
import { NAV_HEADER_MAX_LINKS, normalizeNavHeaderProps, type NavHeaderLink } from "@/lib/preview/nav-header-block";
import { normalizeSectionProps, SECTION_PADDING_Y_OPTIONS, type SectionPaddingY } from "@/lib/preview/section-block";
import { normalizeSplitProps, type SplitCrossAlign, type SplitRatio } from "@/lib/preview/split-block";
import { normalizeTestimonialProps } from "@/lib/preview/testimonial-block";
import { normalizeTextProps, type TextAlign, type TextRole, type TextSizeScale } from "@/lib/preview/text-block";
import {
  isPreviewPinchBridgeMessage,
  isPreviewWheelBridgeMessage,
  isPinchZoomWheelEvent,
  isPinchZoomWheelFlags,
  normalizeWheelPixelDeltas,
} from "@/lib/preview/preview-wheel-bridge";

import {
  BUILTIN_EDITOR_PREVIEW_BREAKPOINTS,
  clampPreviewBreakpointDims,
  loadCustomEditorPreviewBreakpoints,
  loadStoredPreviewBreakpointId,
  saveCustomEditorPreviewBreakpoints,
  saveStoredPreviewBreakpointId,
  splitPreviewBreakpointsForChrome,
  type EditorPreviewBreakpoint,
} from "./preview-breakpoints";
import { MotionPropsFields } from "./motion-props-fields";
import { PresetPickerModal } from "./preset-picker-modal";

const UNSAVED_NAV_MESSAGE =
  "You have unsaved changes. If you switch pages now, those edits will be lost. Continue anyway?";

/** Canonical landing slug — only this row uses the home icon in the page list. */
const HOME_PAGE_SLUG = "home";

const TEXT_TONE_OPTIONS: TextTone[] = ["default", "muted", "inverse", "accent"];
const TEXT_SIZE_SCALE_OPTIONS: TextSizeScale[] = ["sm", "base", "lg", "xl"];
const HEADING_SIZE_SCALE_OPTIONS: HeadingSizeScale[] = ["sm", "base", "lg", "xl", "2xl", "3xl"];
const LEADING_OPTIONS: LeadingToken[] = ["normal", "snug", "relaxed", "loose"];
const TRACKING_OPTIONS: TrackingToken[] = ["normal", "tight", "wide"];
const FRAME_SURFACE_OPTIONS: FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent"];
const EXPLICIT_SIZE_UNITS: SizeUnit[] = ["auto", "px", "pct", "vw", "vh"];
const MIN_HEIGHT_UNITS: Exclude<SizeUnit, "auto">[] = ["px", "pct", "vw", "vh"];
const IMAGE_DIM_UNITS: ImageDimensionUnit[] = ["px", "pct", "vw", "vh"];
const IMAGE_FIXED_DIM_UNITS: ImageDimensionUnit[] = ["px", "vw", "vh"];
const FRAME_FIXED_SIZE_UNITS: Exclude<SizeUnit, "auto" | "pct">[] = ["px", "vw", "vh"];
const CURSOR_OPTIONS: CursorToken[] = ["default", "pointer", "text", "not-allowed", "move"];

const AXIS_SIZE_LABEL: Record<AxisSizeMode, string> = {
  fixed: "Fixed",
  relative: "Relative",
  fill: "Fill",
  fit: "Fit content",
};

function sizeUnitLabel(u: SizeUnit | ImageDimensionUnit): string {
  if (u === "pct") {
    return "%";
  }
  return u;
}

/** Returns a pruned copy of the tree: matching nodes keep full subtrees; ancestors stay if any descendant matches. */
function filterPageNodeTree(node: PageNode, query: string): PageNode | null {
  const q = query.trim().toLowerCase();
  if (!q) {
    return node;
  }
  const selfMatch =
    node.id.toLowerCase().includes(q) ||
    node.type.toLowerCase().includes(q) ||
    getDisplayLayerName(node).toLowerCase().includes(q);
  const nextChildren: PageNode[] = [];
  for (const child of node.children) {
    const filtered = filterPageNodeTree(child, query);
    if (filtered) {
      nextChildren.push(filtered);
    }
  }
  if (selfMatch) {
    return { ...node, children: [...node.children] };
  }
  if (nextChildren.length > 0) {
    return { ...node, children: nextChildren };
  }
  return null;
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5.25v-7H9.25v7H4a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20 16.65 16.65" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconCrossSmall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconMoreHorizontal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

function closeDetailsFromEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return;
  }
  target.closest("details")?.removeAttribute("open");
}

function PreviewBpPill({
  bp,
  isActive,
  onSelect,
  onRemoveCustom,
  closeParentDetails,
}: {
  bp: EditorPreviewBreakpoint;
  isActive: boolean;
  onSelect: () => void;
  onRemoveCustom?: () => void;
  /** When used inside a `<details>` menu, close it after choosing a preset. */
  closeParentDetails?: boolean;
}) {
  return (
    <div className="ec-preview-bp-item flex shrink-0 items-stretch">
      <button
        type="button"
        className={`ec-preview-bp-btn flex min-w-0 max-w-[7.25rem] shrink-0 flex-col items-center justify-center rounded-md px-2 py-1.5 text-center transition-colors ${
          isActive ? "ec-preview-bp-btn-active" : ""
        }`}
        onClick={(e) => {
          onSelect();
          if (closeParentDetails) {
            e.currentTarget.closest("details")?.removeAttribute("open");
          }
        }}
      >
        <span className="truncate text-[11px] font-medium leading-tight">{bp.label}</span>
        <span className="ec-preview-bp-dims font-mono text-[9px] leading-tight opacity-80">{bp.width}×{bp.height}</span>
      </button>
      {!bp.builtIn && onRemoveCustom ? (
        <button
          type="button"
          className="ec-preview-bp-delete"
          aria-label={`Remove size ${bp.label}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveCustom();
          }}
        >
          <IconCrossSmall className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function PageListRow({
  slugEntry,
  isActive,
  showDraftBadge,
  busy,
  onSelect,
  onOpenPreview,
}: {
  slugEntry: string;
  isActive: boolean;
  showDraftBadge: boolean;
  busy: boolean;
  onSelect: () => void;
  onOpenPreview: () => void;
}) {
  return (
    <div
      className={`ec-page-list-row group flex items-stretch overflow-hidden rounded-lg ${
        isActive ? "ec-page-list-row-current" : "ec-page-list-row-idle"
      }`}
    >
      <button
        type="button"
        className="ec-page-list-row-main flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left transition-colors disabled:opacity-40"
        onClick={onSelect}
        disabled={busy}
        aria-current={isActive ? "page" : undefined}
      >
        {slugEntry === HOME_PAGE_SLUG ? (
          <IconHome className="ec-page-list-row-home h-4 w-4 shrink-0" />
        ) : (
          <IconFile className="ec-page-list-row-file h-4 w-4 shrink-0" />
        )}
        <span className="truncate font-mono text-[13px]">{slugEntry}</span>
        {showDraftBadge ? <span className="ec-badge-draft ml-auto shrink-0">Draft</span> : null}
      </button>
      <details className="ec-page-row-details relative shrink-0" name="page-row-menu">
        <summary
          className="ec-page-row-more-summary flex h-full cursor-pointer list-none items-center justify-center px-1.5 [&::-webkit-details-marker]:hidden"
          aria-label={`More options for ${slugEntry}`}
          onMouseDown={(e) => e.preventDefault()}
        >
          <IconMoreHorizontal className="ec-page-row-more-icon h-4 w-4" />
        </summary>
        <div
          className="ec-page-row-menu absolute right-0 top-full z-20 mt-0.5 min-w-[9.5rem] overflow-hidden rounded-lg py-1 shadow-lg"
          role="menu"
        >
          <button
            type="button"
            className="ec-page-row-menu-item block w-full px-3 py-1.5 text-left text-[13px]"
            role="menuitem"
            onClick={async (e) => {
              try {
                await navigator.clipboard.writeText(slugEntry);
              } catch {
                window.alert("Could not copy to the clipboard.");
              }
              closeDetailsFromEventTarget(e.currentTarget);
            }}
          >
            Copy slug
          </button>
          <button
            type="button"
            className="ec-page-row-menu-item block w-full px-3 py-1.5 text-left text-[13px]"
            role="menuitem"
            onClick={(e) => {
              onOpenPreview();
              closeDetailsFromEventTarget(e.currentTarget);
            }}
          >
            Open preview
          </button>
        </div>
      </details>
    </div>
  );
}

function TreeRowItem({
  row,
  node,
  selectedId,
  onSelect,
  isSelectedBranch,
  collapsedIds,
  onToggleCollapse,
  dragActiveId,
  dragOverSlot,
  registerRowEl,
}: {
  row: TreeDndRow;
  node: PageNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isSelectedBranch: boolean;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  dragActiveId: string | null;
  dragOverSlot: TreeDndSlot | null;
  registerRowEl: (id: string, el: HTMLElement | null) => void;
}) {
  const isSelected = node.id === selectedId;
  const hasChildren = node.children.length > 0;
  const isCollapsed = hasChildren && collapsedIds.has(node.id);
  const isRoot = node.id === "root";

  // Draggable (the button is the handle so the whole row can be a drop target)
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: node.id, disabled: isRoot });

  // Droppable (entire row div)
  const { setNodeRef: setDropRef } = useDroppable({ id: node.id });

  const isActive = dragActiveId === node.id;
  const isDropTarget = dragOverSlot?.overNodeId === node.id && !isActive;
  const isInside = isDropTarget && dragOverSlot?.placement === "inside";

  /** Combine dnd-kit droppable ref with our registry ref so the indicator can read getBoundingClientRect. */
  const composedRef = useCallback(
    (el: HTMLElement | null) => {
      setDropRef(el);
      registerRowEl(node.id, el);
    },
    [node.id, registerRowEl, setDropRef],
  );

  return (
    <div className={`select-none ${isSelected ? "ec-tree-selected-subtree" : ""}`}>
      <div
        ref={composedRef}
        data-tree-row-id={node.id}
        data-tree-row-depth={row.depth}
        className={[
          "ec-tree-btn flex w-full items-center gap-2 py-1.5 pr-2 text-left text-[13px] transition-colors",
          isSelected ? "ec-tree-btn-selected" : "",
          !isSelected && isSelectedBranch ? "ec-tree-btn-descendant" : "",
          isActive || isDragging ? "ec-tree-btn-dragging" : "",
          isInside ? "ec-tree-btn-drop-inside" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ paddingLeft: `${10 + row.depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isCollapsed ? "Expand children" : "Collapse children"}
            className="ec-tree-collapse-btn inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCollapse(node.id);
            }}
          >
            <IconChevronDown
              className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
            />
          </button>
        ) : (
          <span className="inline-block h-4 w-4 shrink-0" aria-hidden />
        )}
        <button
          ref={setDragRef}
          type="button"
          onClick={() => onSelect(node.id)}
          className="ec-tree-row-main min-w-0 flex flex-1 items-center gap-2 text-left"
          aria-current={isSelected ? "true" : undefined}
          {...attributes}
          {...listeners}
        >
          <span className="ec-tree-type shrink-0 font-mono text-[11px]">{node.type}</span>
          <span className="ec-tree-label min-w-0 flex-1 truncate text-[13px]">{getDisplayLayerName(node)}</span>
        </button>
      </div>
    </div>
  );
}

function PropsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ec-props-section">
      <div className="ec-props-section-head">
        <h3 className="ec-props-section-title">{title}</h3>
      </div>
      <div className="ec-props-section-body">{children}</div>
    </section>
  );
}

/** Compact single-row drag ghost (Framer-style — no full subtree). */
function TreeDragOverlayRow({ node }: { node: PageNode }) {
  const hasChildren = node.children.length > 0;
  return (
    <div className="ec-tree-drag-overlay-row flex items-center gap-2 px-2 py-1 text-left text-[13px]">
      {hasChildren ? (
        <IconChevronDown className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <span className="inline-block h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span className="ec-tree-type shrink-0 font-mono text-[11px]">{node.type}</span>
      <span className="ec-tree-label min-w-0 flex-1 truncate text-[13px]">{getDisplayLayerName(node)}</span>
    </div>
  );
}

/**
 * Single absolute-positioned drop indicator (Framer-style).
 *
 * Reads the over-row's bounding rect via DOM (no per-row pseudo-elements that jiggle).
 * Indents to the depth where the dragged node will actually land.
 */
function TreeDropIndicator({
  containerRef,
  rowEls,
  slot,
  parentIdByNodeId,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rowEls: React.MutableRefObject<Map<string, HTMLElement>>;
  slot: TreeDndSlot | null;
  parentIdByNodeId: Map<string, string | null>;
}) {
  const [rect, setRect] = useState<{ top: number; left: number; right: number } | null>(null);

  useEffect(() => {
    if (!slot || slot.placement === "inside") {
      setRect(null);
      return;
    }
    const container = containerRef.current;
    const rowEl = rowEls.current.get(slot.overNodeId);
    if (!container || !rowEl) {
      setRect(null);
      return;
    }
    const cRect = container.getBoundingClientRect();
    const rRect = rowEl.getBoundingClientRect();
    /** Visual depth of the line = depth of the over-row (we land in same parent for before/after). */
    const depthAttr = rowEl.getAttribute("data-tree-row-depth");
    const depth = depthAttr ? Number.parseInt(depthAttr, 10) || 0 : 0;
    void parentIdByNodeId;
    const indentLeft = 10 + depth * 12;
    const top = (slot.placement === "before" ? rRect.top : rRect.bottom) - cRect.top + container.scrollTop;
    setRect({
      top,
      left: indentLeft,
      right: 6,
    });
  }, [containerRef, parentIdByNodeId, rowEls, slot]);

  if (!rect) {
    return null;
  }
  return (
    <div
      className="ec-tree-drop-line"
      style={{ top: rect.top, left: rect.left, right: rect.right }}
      aria-hidden
    />
  );
}

const ADD_BLOCK_KINDS: EditorChildKind[] = [
  "heading",
  "text",
  "link",
  "button",
  "image",
  "frame",
  "section",
  "split",
  "card",
  "faq",
  "testimonial",
  "logo-cloud",
  "nav-header",
];

const ADD_BLOCK_LABEL: Record<EditorChildKind, string> = {
  heading: "Add Heading",
  text: "Add Text",
  link: "Add Link",
  button: "Add Button",
  image: "Add Image",
  frame: "Add Frame",
  section: "Add Section",
  split: "Add Split",
  card: "Add Card",
  faq: "Add FAQ",
  testimonial: "Add Testimonial",
  "logo-cloud": "Add Logo cloud",
  "nav-header": "Add Nav header",
};

const SPLIT_ALIGN_OPTIONS: SplitCrossAlign[] = ["stretch", "start", "center", "end"];
const SPLIT_RATIO_OPTIONS: SplitRatio[] = ["equal", "startWide", "endWide"];

function AddBlockButtonGrid({
  nodeId,
  addChildTo,
}: {
  nodeId: string;
  addChildTo: (parentId: string, kind: EditorChildKind, options?: { selectNew?: boolean }) => void;
}) {
  return (
    <div className="mt-1">
      <p className="ec-props-hint mb-2 text-[11px]">Tipp: Shift+Click fuegt hinzu und behaelt den Parent ausgewaehlt.</p>
      <div className="grid grid-cols-2 gap-2">
      {ADD_BLOCK_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          className="ec-props-action-btn w-full text-[12px]"
          onClick={(e) => addChildTo(nodeId, kind, { selectNew: !e.shiftKey })}
        >
          {ADD_BLOCK_LABEL[kind]}
        </button>
      ))}
      </div>
    </div>
  );
}

function readFrameWhenNumber(
  props: Record<string, unknown>,
  bp: FrameBreakpointKey,
  key: "gap" | "padding" | "columns",
): string {
  const w = props.when;
  if (!w || typeof w !== "object") {
    return "";
  }
  const b = (w as Record<string, unknown>)[bp];
  if (!b || typeof b !== "object") {
    return "";
  }
  const v = (b as Record<string, unknown>)[key];
  return typeof v === "number" ? String(v) : "";
}

function readFrameWhenVisible(props: Record<string, unknown>, bp: FrameBreakpointKey): boolean | "inherit" {
  const w = props.when;
  if (!w || typeof w !== "object") {
    return "inherit";
  }
  const b = (w as Record<string, unknown>)[bp];
  if (!b || typeof b !== "object") {
    return "inherit";
  }
  if (!("visible" in b)) {
    return "inherit";
  }
  return Boolean((b as Record<string, unknown>).visible);
}

function readWhenSelect(
  props: Record<string, unknown>,
  bp: FrameBreakpointKey,
  key: "align" | "sizeScale",
): string {
  const w = props.when;
  if (!w || typeof w !== "object") {
    return "";
  }
  const b = (w as Record<string, unknown>)[bp];
  if (!b || typeof b !== "object") {
    return "";
  }
  const v = (b as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

function DocumentSettingsPanel() {
  const document = useEditorStore((s) => s.document);
  const patchPageDocument = useEditorStore((s) => s.patchPageDocument);
  if (!document) {
    return null;
  }
  const theme = document.theme ?? {};
  const meta = document.meta ?? {};
  return (
    <div className="ec-document-settings mb-4 border-b border-zinc-200/80 pb-4">
      <PropsSection title="Page (document)">
        <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
          Theme gilt für die ganze Seite (Preview + öffentliche Seite). Meta steuert Titel/Beschreibung/OG-Bild.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Corner radius (shell)</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={theme.radius ?? "none"}
              onChange={(e) =>
                patchPageDocument({
                  theme: { ...theme, radius: e.target.value as NonNullable<PageTheme["radius"]> },
                })
              }
            >
              <option value="none">none</option>
              <option value="sm">sm</option>
              <option value="md">md</option>
              <option value="lg">lg</option>
              <option value="xl">xl</option>
            </select>
          </label>
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Color scheme</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={theme.colorScheme ?? "light"}
              onChange={(e) =>
                patchPageDocument({
                  theme: { ...theme, colorScheme: e.target.value as NonNullable<PageTheme["colorScheme"]> },
                })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Typography scale</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={theme.typographyScale ?? "default"}
              onChange={(e) =>
                patchPageDocument({
                  theme: { ...theme, typographyScale: e.target.value as NonNullable<PageTheme["typographyScale"]> },
                })
              }
            >
              <option value="default">Default</option>
              <option value="large">Large</option>
            </select>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Meta title</span>
            <input
              type="text"
              className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
              placeholder="Browser tab title"
              value={meta.title ?? ""}
              onChange={(e) => patchPageDocument({ meta: { ...meta, title: e.target.value || undefined } })}
            />
          </label>
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Meta description</span>
            <textarea
              className="ec-field ec-input min-h-[72px] resize-y rounded-md px-2.5 py-1.5 font-mono text-[12px]"
              placeholder="Search / social description"
              value={meta.description ?? ""}
              onChange={(e) => patchPageDocument({ meta: { ...meta, description: e.target.value || undefined } })}
            />
          </label>
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">OG image URL</span>
            <input
              type="url"
              className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[11px]"
              placeholder="https://…"
              value={meta.ogImage ?? ""}
              onChange={(e) =>
                patchPageDocument({ meta: { ...meta, ogImage: e.target.value.trim() || undefined } })
              }
            />
          </label>
        </div>
      </PropsSection>
    </div>
  );
}

function PropsPanel() {
  const document = useEditorStore((s) => s.document);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const addChildTo = useEditorStore((s) => s.addChildTo);
  const removeSelectedNode = useEditorStore((s) => s.removeSelectedNode);

  const node = useMemo(() => {
    if (!document || !selectedNodeId) {
      return null;
    }
    return findNodeById(document.root, selectedNodeId);
  }, [document, selectedNodeId]);
  const [imageUploadStatus, setImageUploadStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  useEffect(() => {
    setImageUploadStatus("idle");
    setImageUploadError(null);
  }, [node?.id]);

  const textareaClass =
    "ec-field ec-props-textarea w-full resize-y rounded-lg px-3 py-2.5 text-[13px] leading-relaxed shadow-inner min-h-[120px]";

  if (!node) {
    return (
      <div className="ec-props-empty flex min-h-[140px] flex-col items-center justify-center px-2 text-center">
        <p className="ec-body-text max-w-[14rem] text-[13px] leading-relaxed">
          Select a layer in the tree to edit its properties.
        </p>
      </div>
    );
  }

  if (node.type === "text") {
    const p = normalizeTextProps(node.props);
    return (
      <div className="ec-props-stack">
        <PropsSection title="Text">
          <label htmlFor={`ec-props-text-${node.id}`} className="ec-props-row-label sr-only">
            Content
          </label>
          <textarea
            id={`ec-props-text-${node.id}`}
            className={textareaClass}
            value={p.text}
            onChange={(e) => updateNodeProps(node.id, { text: e.target.value })}
            placeholder="Enter text…"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Element</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.as}
                onChange={(e) => updateNodeProps(node.id, { as: e.target.value as TextRole })}
              >
                <option value="p">Paragraph</option>
                <option value="span">Span</option>
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Align</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.align}
                onChange={(e) => updateNodeProps(node.id, { align: e.target.value as TextAlign })}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
              </select>
            </label>
            <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Max width (px)</span>
              <input
                type="text"
                inputMode="numeric"
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                placeholder="none"
                value={p.maxWidth ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNodeProps(node.id, { maxWidth: null });
                    return;
                  }
                  const n = Number(v);
                  updateNodeProps(node.id, { maxWidth: Number.isFinite(n) ? n : null });
                }}
              />
            </label>
          </div>
        </PropsSection>

        <PropsSection title="Typography">
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Size scale</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.sizeScale ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  updateNodeProps(node.id, { sizeScale: v === "" ? null : v });
                }}
              >
                <option value="">Default (base)</option>
                {TEXT_SIZE_SCALE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Tone</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.tone}
                onChange={(e) => updateNodeProps(node.id, { tone: e.target.value })}
              >
                {TEXT_TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Leading</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.leading}
                onChange={(e) => updateNodeProps(node.id, { leading: e.target.value })}
              >
                {LEADING_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Tracking</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.tracking}
                onChange={(e) => updateNodeProps(node.id, { tracking: e.target.value })}
              >
                {TRACKING_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </PropsSection>
        <PropsSection title="Responsive (min-width)">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Overrides ab jeweils{" "}
            <span className="font-mono">
              sm {FRAME_BREAKPOINT_MIN_PX.sm}px, md {FRAME_BREAKPOINT_MIN_PX.md}px, lg {FRAME_BREAKPOINT_MIN_PX.lg}px
            </span>
            . Leere Auswahl = kein Override.
          </p>
          {(["sm", "md", "lg"] as const).map((bp, idx) => (
            <div
              key={bp}
              className={`ec-props-subgrid grid grid-cols-2 gap-2 ${idx > 0 ? "mt-2 border-t border-zinc-200/60 pt-2" : ""}`}
            >
              <p className="ec-text-muted col-span-2 text-[10px] font-semibold uppercase tracking-wide">{bp}</p>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Align override</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={readWhenSelect(node.props, bp, "align")}
                  onChange={(e) => {
                    const v = e.target.value;
                    const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                      if (v === "") {
                        delete s.align;
                      } else {
                        s.align = v;
                      }
                    });
                    updateNodeProps(node.id, { when: nextWhen });
                  }}
                >
                  <option value="">— (inherit)</option>
                  <option value="start">start</option>
                  <option value="center">center</option>
                  <option value="end">end</option>
                </select>
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Size scale override</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={readWhenSelect(node.props, bp, "sizeScale")}
                  onChange={(e) => {
                    const v = e.target.value;
                    const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                      if (v === "") {
                        delete s.sizeScale;
                      } else {
                        s.sizeScale = v;
                      }
                    });
                    updateNodeProps(node.id, { when: nextWhen });
                  }}
                >
                  <option value="">— (inherit)</option>
                  {TEXT_SIZE_SCALE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "heading") {
    const p = normalizeHeadingProps(node.props);
    const rawAs = typeof node.props.as === "string" ? node.props.as : "";
    const asSelectValue = rawAs.trim() === "" ? "" : rawAs.toLowerCase();
    return (
      <div className="ec-props-stack">
        <PropsSection title="Heading">
          <label className="ec-label mt-1 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Text</span>
            <input
              type="text"
              className="ec-input rounded-md px-2.5 py-1.5 text-[13px]"
              value={p.text}
              onChange={(e) => updateNodeProps(node.id, { text: e.target.value })}
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Level</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                value={p.level}
                onChange={(e) => updateNodeProps(node.id, { level: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    H{n}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Align</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.align}
                onChange={(e) => updateNodeProps(node.id, { align: e.target.value })}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
              </select>
            </label>
            <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Tag override</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={asSelectValue}
                onChange={(e) => updateNodeProps(node.id, { as: e.target.value })}
              >
                <option value="">Auto (from level)</option>
                <option value="h1">h1</option>
                <option value="h2">h2</option>
                <option value="h3">h3</option>
                <option value="h4">h4</option>
                <option value="h5">h5</option>
                <option value="h6">h6</option>
                <option value="p">p</option>
              </select>
            </label>
          </div>
        </PropsSection>

        <PropsSection title="Typography">
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-4">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Size scale</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.sizeScale ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  updateNodeProps(node.id, { sizeScale: v === "" ? null : v });
                }}
              >
                <option value="">Auto (from level)</option>
                {HEADING_SIZE_SCALE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Tone</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.tone}
                onChange={(e) => updateNodeProps(node.id, { tone: e.target.value })}
              >
                {TEXT_TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Leading</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.leading}
                onChange={(e) => updateNodeProps(node.id, { leading: e.target.value })}
              >
                {LEADING_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Tracking</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.tracking}
                onChange={(e) => updateNodeProps(node.id, { tracking: e.target.value })}
              >
                {TRACKING_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </PropsSection>
        <PropsSection title="Responsive (min-width)">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Overrides ab jeweils{" "}
            <span className="font-mono">
              sm {FRAME_BREAKPOINT_MIN_PX.sm}px, md {FRAME_BREAKPOINT_MIN_PX.md}px, lg {FRAME_BREAKPOINT_MIN_PX.lg}px
            </span>
            . Leere Auswahl = kein Override.
          </p>
          {(["sm", "md", "lg"] as const).map((bp, idx) => (
            <div
              key={bp}
              className={`ec-props-subgrid grid grid-cols-2 gap-2 ${idx > 0 ? "mt-2 border-t border-zinc-200/60 pt-2" : ""}`}
            >
              <p className="ec-text-muted col-span-2 text-[10px] font-semibold uppercase tracking-wide">{bp}</p>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Align override</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={readWhenSelect(node.props, bp, "align")}
                  onChange={(e) => {
                    const v = e.target.value;
                    const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                      if (v === "") {
                        delete s.align;
                      } else {
                        s.align = v;
                      }
                    });
                    updateNodeProps(node.id, { when: nextWhen });
                  }}
                >
                  <option value="">— (inherit)</option>
                  <option value="start">start</option>
                  <option value="center">center</option>
                  <option value="end">end</option>
                </select>
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Size scale override</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={readWhenSelect(node.props, bp, "sizeScale")}
                  onChange={(e) => {
                    const v = e.target.value;
                    const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                      if (v === "") {
                        delete s.sizeScale;
                      } else {
                        s.sizeScale = v;
                      }
                    });
                    updateNodeProps(node.id, { when: nextWhen });
                  }}
                >
                  <option value="">— (inherit)</option>
                  {HEADING_SIZE_SCALE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "link") {
    const p = normalizeLinkProps(node.props);
    return (
      <div className="ec-props-stack">
        <PropsSection title="Link">
          <div className="mt-1 grid grid-cols-1 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Label</span>
              <input
                type="text"
                className="ec-input rounded-md px-2.5 py-1.5 text-[13px]"
                value={p.label}
                onChange={(e) => updateNodeProps(node.id, { label: e.target.value })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">URL</span>
              <input
                type="url"
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.href}
                onChange={(e) => updateNodeProps(node.id, { href: e.target.value })}
              />
            </label>
            <label className="ec-label flex flex-row items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={p.external}
                onChange={(e) => updateNodeProps(node.id, { external: e.target.checked })}
              />
              <span className="ec-text-muted">Open in new tab</span>
            </label>
          </div>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "button") {
    const p = normalizeButtonProps(node.props);
    const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "inverse"];
    const variantLabel: Record<ButtonVariant, string> = {
      primary: "Primary",
      secondary: "Secondary",
      ghost: "Ghost",
      inverse: "Inverse (on dark)",
    };
    return (
      <div className="ec-props-stack">
        <PropsSection title="Button">
          <div className="mt-1 grid grid-cols-1 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Label</span>
              <input
                type="text"
                className="ec-input rounded-md px-2.5 py-1.5 text-[13px]"
                value={p.label}
                onChange={(e) => updateNodeProps(node.id, { label: e.target.value })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Link URL (empty = button)</span>
              <input
                type="text"
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                placeholder="https://…"
                value={p.href ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  updateNodeProps(node.id, { href: v === "" ? null : v });
                }}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Variant</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.variant}
                onChange={(e) => updateNodeProps(node.id, { variant: e.target.value })}
              >
                {variants.map((v) => (
                  <option key={v} value={v}>
                    {variantLabel[v]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "image") {
    const p = normalizeImageProps(node.props);
    const fits: ImageFit[] = ["cover", "contain", "fill", "none"];
    const uploadImage = async (file: File) => {
      setImageUploadStatus("uploading");
      setImageUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/assets/upload", {
          method: "POST",
          body: formData,
        });
        const body: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            body && typeof body === "object" && "error" in body
              ? String((body as { error: unknown }).error)
              : `upload_failed_${res.status}`;
          throw new Error(msg);
        }
        const url =
          body && typeof body === "object" && "url" in body && typeof (body as { url: unknown }).url === "string"
            ? (body as { url: string }).url
            : null;
        if (!url) {
          throw new Error("upload_missing_url");
        }
        updateNodeProps(node.id, { src: url });
        setImageUploadStatus("idle");
      } catch (e) {
        setImageUploadStatus("error");
        setImageUploadError(e instanceof Error ? e.message : "upload_failed");
      }
    };

    return (
      <div className="ec-props-stack">
        <PropsSection title="Image">
          <div className="mt-1 grid grid-cols-1 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Upload image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="ec-input rounded-md px-2.5 py-1.5 text-[12px]"
                disabled={imageUploadStatus === "uploading"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void uploadImage(file);
                  // Allow uploading the same file again if needed.
                  e.currentTarget.value = "";
                }}
              />
              <span className="ec-text-muted text-[10px]">PNG/JPG/WebP/GIF/SVG, max 8MB.</span>
              {imageUploadStatus === "uploading" ? (
                <span className="text-[10px] text-[var(--editor-text-muted)]">Uploading…</span>
              ) : null}
              {imageUploadError ? <span className="text-[10px] text-red-500">{imageUploadError}</span> : null}
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Image URL</span>
              <input
                type="url"
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[11px]"
                value={p.src}
                onChange={(e) => updateNodeProps(node.id, { src: e.target.value })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Alt text</span>
              <input
                type="text"
                className="ec-input rounded-md px-2.5 py-1.5 text-[13px]"
                value={p.alt}
                onChange={(e) => updateNodeProps(node.id, { alt: e.target.value })}
              />
            </label>
            <p className="ec-props-hint text-[11px] leading-relaxed">
              Größe wie in Framer: Fixed, Relative (%), Fill, Fit content.
            </p>
            <p className="ec-props-hint mb-1 mt-2 text-[11px] font-medium text-[var(--editor-text-muted)]">Width</p>
            <div className="grid grid-cols-2 gap-1">
              {AXIS_SIZE_MODES.map((mode) => (
                <button
                  key={`img-w-${mode}`}
                  type="button"
                  className={`ec-tab-segment-btn rounded-md px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition-colors ${
                    p.widthSizeMode === mode ? "ec-tab-segment-btn-active" : ""
                  }`}
                  onClick={() =>
                    updateNodeProps(node.id, {
                      widthSizeMode: mode,
                      ...(mode === "relative" ? { widthUnit: "pct" } : {}),
                      ...(mode === "fixed" && p.widthUnit === "pct" ? { widthUnit: "px" } : {}),
                    })
                  }
                >
                  {AXIS_SIZE_LABEL[mode]}
                </button>
              ))}
            </div>
            {p.widthSizeMode === "fixed" || p.widthSizeMode === "relative" ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="ec-label flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Width value</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                    placeholder="—"
                    value={p.width ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === "") {
                        updateNodeProps(node.id, { width: null });
                        return;
                      }
                      const n = Number(v);
                      updateNodeProps(node.id, { width: Number.isFinite(n) ? n : null });
                    }}
                  />
                </label>
                <label className="ec-label flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Width unit</span>
                  <select
                    className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                    value={p.widthSizeMode === "relative" ? "pct" : p.widthUnit}
                    onChange={(e) => updateNodeProps(node.id, { widthUnit: e.target.value })}
                    disabled={p.widthSizeMode === "relative"}
                  >
                    {(p.widthSizeMode === "relative" ? (["pct"] as const) : IMAGE_FIXED_DIM_UNITS).map((u) => (
                      <option key={u} value={u}>
                        {sizeUnitLabel(u)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            <p className="ec-props-hint mb-1 mt-3 text-[11px] font-medium text-[var(--editor-text-muted)]">Height</p>
            <div className="grid grid-cols-2 gap-1">
              {AXIS_SIZE_MODES.map((mode) => (
                <button
                  key={`img-h-${mode}`}
                  type="button"
                  className={`ec-tab-segment-btn rounded-md px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition-colors ${
                    p.heightSizeMode === mode ? "ec-tab-segment-btn-active" : ""
                  }`}
                  onClick={() =>
                    updateNodeProps(node.id, {
                      heightSizeMode: mode,
                      ...(mode === "relative" ? { heightUnit: "pct" } : {}),
                      ...(mode === "fixed" && p.heightUnit === "pct" ? { heightUnit: "px" } : {}),
                    })
                  }
                >
                  {AXIS_SIZE_LABEL[mode]}
                </button>
              ))}
            </div>
            {p.heightSizeMode === "fixed" || p.heightSizeMode === "relative" ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="ec-label flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Height value</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                    placeholder="—"
                    value={p.height ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === "") {
                        updateNodeProps(node.id, { height: null });
                        return;
                      }
                      const n = Number(v);
                      updateNodeProps(node.id, { height: Number.isFinite(n) ? n : null });
                    }}
                  />
                </label>
                <label className="ec-label flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Height unit</span>
                  <select
                    className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                    value={p.heightSizeMode === "relative" ? "pct" : p.heightUnit}
                    onChange={(e) => updateNodeProps(node.id, { heightUnit: e.target.value })}
                    disabled={p.heightSizeMode === "relative"}
                  >
                    {(p.heightSizeMode === "relative" ? (["pct"] as const) : IMAGE_FIXED_DIM_UNITS).map((u) => (
                      <option key={u} value={u}>
                        {sizeUnitLabel(u)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Object fit</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.fit}
                onChange={(e) => updateNodeProps(node.id, { fit: e.target.value })}
              >
                {fits.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Corner radius (px)</span>
              <input
                type="text"
                inputMode="numeric"
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                placeholder="default (8)"
                value={p.radiusPx ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNodeProps(node.id, { radiusPx: null, radius: null });
                    return;
                  }
                  const n = Number(v);
                  updateNodeProps(node.id, {
                    radiusPx: Number.isFinite(n) ? Math.min(64, Math.max(0, Math.round(n))) : null,
                  });
                }}
              />
            </label>
          </div>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "section") {
    const p = normalizeSectionProps(node.props);
    return (
      <div className="ec-props-stack">
        <PropsSection title="Section">
          <label className="ec-label mt-1 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Vertical spacing</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={p.paddingY}
              onChange={(e) => updateNodeProps(node.id, { paddingY: e.target.value as SectionPaddingY })}
            >
              {SECTION_PADDING_Y_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="ec-label mt-1 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Anchor id (optional)</span>
            <input
              type="text"
              className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
              placeholder="e.g. pricing — becomes DOM id for #links"
              value={typeof node.props.anchorId === "string" ? node.props.anchorId : ""}
              onChange={(e) => updateNodeProps(node.id, { anchorId: e.target.value })}
            />
            {p.anchorId ? (
              <span className="ec-text-muted text-[10px]">
                Renders as <code className="font-mono">id=&quot;{p.anchorId}&quot;</code>
              </span>
            ) : null}
          </label>
        </PropsSection>
        <PropsSection title="Motion">
          <MotionPropsFields nodeId={node.id} motion={p} updateNodeProps={updateNodeProps} />
        </PropsSection>
        <PropsSection title="Add blocks">
          <AddBlockButtonGrid nodeId={node.id} addChildTo={addChildTo} />
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "split") {
    const p = normalizeSplitProps(node.props);
    return (
      <div className="ec-props-stack">
        <PropsSection title="Split layout">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Row on medium+ screens, stacked on small. With exactly two children, <strong>ratio</strong> biases column
            width.
          </p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Gap (px)</span>
              <input
                type="number"
                min={0}
                max={96}
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.gap}
                onChange={(e) => updateNodeProps(node.id, { gap: Number(e.target.value) })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Align (cross)</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.align}
                onChange={(e) => updateNodeProps(node.id, { align: e.target.value })}
              >
                {SPLIT_ALIGN_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Ratio (2 children)</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.ratio}
                onChange={(e) => updateNodeProps(node.id, { ratio: e.target.value })}
              >
                {SPLIT_RATIO_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </PropsSection>
        <PropsSection title="Add blocks">
          <AddBlockButtonGrid nodeId={node.id} addChildTo={addChildTo} />
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "card") {
    const p = normalizeCardProps(node.props);
    return (
      <div className="ec-props-stack">
        <PropsSection title="Card">
          <div className="mt-1 grid grid-cols-2 gap-2">
            <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Surface</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.surface}
                onChange={(e) => updateNodeProps(node.id, { surface: e.target.value })}
              >
                {FRAME_SURFACE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Padding (px)</span>
              <input
                type="number"
                min={0}
                max={64}
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.padding}
                onChange={(e) => updateNodeProps(node.id, { padding: Number(e.target.value) })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Radius (px)</span>
              <input
                type="number"
                min={0}
                max={32}
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.radius}
                onChange={(e) => updateNodeProps(node.id, { radius: Number(e.target.value) })}
              />
            </label>
            <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Hover effect</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.interaction}
                onChange={(e) => updateNodeProps(node.id, { interaction: e.target.value })}
              >
                <option value="none">none</option>
                <option value="lift">lift</option>
                <option value="glow">glow</option>
              </select>
            </label>
          </div>
        </PropsSection>
        <PropsSection title="Add blocks">
          <AddBlockButtonGrid nodeId={node.id} addChildTo={addChildTo} />
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "faq") {
    const p = normalizeFaqProps(node.props);
    const setItems = (items: FaqItem[]) => {
      updateNodeProps(node.id, { items });
    };
    return (
      <div className="ec-props-stack">
        <PropsSection title="FAQ">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Q/A pairs render as native <strong>&lt;details&gt;</strong> rows. This block does not use tree children — edit
            the list below.
          </p>
          <label className="ec-label mb-3 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Surface</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={p.surface}
              onChange={(e) => updateNodeProps(node.id, { surface: e.target.value })}
            >
              {FRAME_SURFACE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-3">
            {p.items.map((item, i) => (
              <div key={i} className="rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="ec-text-muted text-[10px] font-medium uppercase tracking-wide">Pair {i + 1}</span>
                  <button
                    type="button"
                    className="ec-props-action-btn shrink-0 px-2 py-1 text-[11px]"
                    disabled={p.items.length <= 1}
                    onClick={() => setItems(p.items.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                </div>
                <label className="ec-label mb-2 flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Question</span>
                  <textarea
                    className="ec-input min-h-[2.5rem] rounded-md px-2 py-1.5 font-sans text-[12px]"
                    rows={2}
                    value={item.question}
                    onChange={(e) => {
                      const next = p.items.map((it, j) => (j === i ? { ...it, question: e.target.value } : it));
                      setItems(next);
                    }}
                  />
                </label>
                <label className="ec-label flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Answer</span>
                  <textarea
                    className="ec-input min-h-[4rem] rounded-md px-2 py-1.5 font-sans text-[12px]"
                    rows={4}
                    value={item.answer}
                    onChange={(e) => {
                      const next = p.items.map((it, j) => (j === i ? { ...it, answer: e.target.value } : it));
                      setItems(next);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="ec-props-action-btn mt-3 w-full text-[12px]"
            disabled={p.items.length >= FAQ_MAX_ITEMS}
            onClick={() => setItems([...p.items, { question: "", answer: "" }])}
          >
            Add question
          </button>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "testimonial") {
    const p = normalizeTestimonialProps(node.props);
    return (
      <div className="ec-props-stack">
        <PropsSection title="Testimonial">
          <label className="ec-label mb-2 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Surface</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={p.surface}
              onChange={(e) => updateNodeProps(node.id, { surface: e.target.value })}
            >
              {FRAME_SURFACE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="ec-label mb-2 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Quote</span>
            <textarea
              className="ec-input min-h-[4rem] rounded-md px-2 py-1.5 font-sans text-[12px]"
              rows={4}
              value={p.quote}
              onChange={(e) => updateNodeProps(node.id, { quote: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Author</span>
              <input
                type="text"
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.author}
                onChange={(e) => updateNodeProps(node.id, { author: e.target.value })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Role</span>
              <input
                type="text"
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.role}
                onChange={(e) => updateNodeProps(node.id, { role: e.target.value })}
              />
            </label>
          </div>
          <label className="ec-label mt-2 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Avatar URL (optional)</span>
            <input
              type="text"
              className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
              value={p.avatarSrc ?? ""}
              onChange={(e) => updateNodeProps(node.id, { avatarSrc: e.target.value })}
            />
          </label>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "logo-cloud") {
    const p = normalizeLogoCloudProps(node.props);
    const setLogos = (logos: LogoCloudItem[]) => updateNodeProps(node.id, { logos });
    return (
      <div className="ec-props-stack">
        <PropsSection title="Logo cloud">
          <label className="ec-label mb-2 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Surface</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={p.surface}
              onChange={(e) => updateNodeProps(node.id, { surface: e.target.value })}
            >
              {FRAME_SURFACE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="ec-label mb-2 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Title (optional)</span>
            <input
              type="text"
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={p.title}
              onChange={(e) => updateNodeProps(node.id, { title: e.target.value })}
            />
          </label>
          <div className="flex flex-col gap-2.5">
            {p.logos.map((logo, i) => (
              <div key={i} className="rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="ec-text-muted text-[10px] font-medium uppercase tracking-wide">Logo {i + 1}</span>
                  <button
                    type="button"
                    className="ec-props-action-btn px-2 py-1 text-[11px]"
                    disabled={p.logos.length <= 1}
                    onClick={() => setLogos(p.logos.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">Name</span>
                    <input
                      type="text"
                      className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                      value={logo.name}
                      onChange={(e) => {
                        const next = p.logos.map((it, j) => (j === i ? { ...it, name: e.target.value } : it));
                        setLogos(next);
                      }}
                    />
                  </label>
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">Image URL (optional)</span>
                    <input
                      type="text"
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={logo.src}
                      onChange={(e) => {
                        const next = p.logos.map((it, j) => (j === i ? { ...it, src: e.target.value } : it));
                        setLogos(next);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="ec-props-action-btn mt-3 w-full text-[12px]"
            disabled={p.logos.length >= LOGO_CLOUD_MAX_ITEMS}
            onClick={() => setLogos([...p.logos, { name: "", src: "" }])}
          >
            Add logo
          </button>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "nav-header") {
    const p = normalizeNavHeaderProps(node.props);
    const setLinks = (links: NavHeaderLink[]) => updateNodeProps(node.id, { links });
    return (
      <div className="ec-props-stack">
        <PropsSection title="Nav header">
          <label className="ec-label mb-2 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Surface</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={p.surface}
              onChange={(e) => updateNodeProps(node.id, { surface: e.target.value })}
            >
              {FRAME_SURFACE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Logo label</span>
              <input
                type="text"
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.logoLabel}
                onChange={(e) => updateNodeProps(node.id, { logoLabel: e.target.value })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Logo href</span>
              <input
                type="text"
                className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                value={p.logoHref}
                onChange={(e) => updateNodeProps(node.id, { logoHref: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-2 flex flex-col gap-2.5">
            {p.links.map((link, i) => (
              <div key={i} className="rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="ec-text-muted text-[10px] font-medium uppercase tracking-wide">Link {i + 1}</span>
                  <button
                    type="button"
                    className="ec-props-action-btn px-2 py-1 text-[11px]"
                    onClick={() => setLinks(p.links.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">Label</span>
                    <input
                      type="text"
                      className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                      value={link.label}
                      onChange={(e) => {
                        const next = p.links.map((it, j) => (j === i ? { ...it, label: e.target.value } : it));
                        setLinks(next);
                      }}
                    />
                  </label>
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">Href</span>
                    <input
                      type="text"
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={link.href}
                      onChange={(e) => {
                        const next = p.links.map((it, j) => (j === i ? { ...it, href: e.target.value } : it));
                        setLinks(next);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="ec-props-action-btn mt-3 w-full text-[12px]"
            disabled={p.links.length >= NAV_HEADER_MAX_LINKS}
            onClick={() => setLinks([...p.links, { label: "", href: "" }])}
          >
            Add nav link
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">CTA label (optional)</span>
              <input
                type="text"
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.ctaLabel}
                onChange={(e) => updateNodeProps(node.id, { ctaLabel: e.target.value })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">CTA href (optional)</span>
              <input
                type="text"
                className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                value={p.ctaHref}
                onChange={(e) => updateNodeProps(node.id, { ctaHref: e.target.value })}
              />
            </label>
          </div>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "frame") {
    const p = normalizeFrameProps(node.props);
    /** Loose fill for inputs — strict `p.fill` snaps partial hex/URLs and fights controlled fields. */
    const fillEditor = normalizeFrameFill(node.props.fill, { editor: true });
    const layoutTypes: FrameLayoutType[] = ["stack", "grid"];
    const directions: FrameDirection[] = ["horizontal", "vertical"];
    return (
      <div className="ec-props-stack">
        <PropsSection title="Position">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Relative = im normalen Fluss; Absolute = <code className="font-mono text-[10px]">position: absolute</code>{" "}
            relativ zum Eltern-Frame. Leere Insets = CSS <code className="font-mono text-[10px]">auto</code>.
          </p>
          <div className="ec-tab-segment flex p-1" role="group" aria-label="Frame position type">
            {(["flow", "absolute"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`ec-tab-segment-btn flex-1 rounded-md px-1 py-1.5 text-center text-[11px] font-medium transition-colors ${
                  p.positionMode === mode ? "ec-tab-segment-btn-active" : ""
                }`}
                onClick={() => updateNodeProps(node.id, { positionMode: mode })}
              >
                {mode === "flow" ? "Relative" : "Absolute"}
              </button>
            ))}
          </div>
          {p.positionMode === "absolute" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["insetTop", "Top (px)"],
                  ["insetRight", "Right (px)"],
                  ["insetBottom", "Bottom (px)"],
                  ["insetLeft", "Left (px)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="ec-label flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">{label}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                    placeholder="auto"
                    value={p[key] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === "") {
                        updateNodeProps(node.id, { [key]: null });
                        return;
                      }
                      const n = Number(v);
                      updateNodeProps(node.id, { [key]: Number.isFinite(n) ? n : null });
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </PropsSection>

        <PropsSection title="Size">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Wie in Framer: <strong>Fixed</strong> (px / vw / vh), <strong>Relative</strong> (%), <strong>Fill</strong>,{" "}
            <strong>Fit content</strong>. Ältere Seiten mit <code className="font-mono text-[10px]">width: hug|fill</code>{" "}
            werden weiter erkannt.
          </p>
          <p className="ec-props-hint mb-1 text-[11px] font-medium text-[var(--editor-text-muted)]">Width</p>
          <div className="grid grid-cols-2 gap-1">
            {AXIS_SIZE_MODES.map((mode) => (
              <button
                key={`w-${mode}`}
                type="button"
                className={`ec-tab-segment-btn rounded-md px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition-colors ${
                  p.widthSizeMode === mode ? "ec-tab-segment-btn-active" : ""
                }`}
                onClick={() =>
                  updateNodeProps(node.id, {
                    widthSizeMode: mode,
                    ...(mode === "relative"
                      ? { widthSizeUnit: "pct" }
                      : mode === "fixed" && (p.widthSizeUnit === "pct" || p.widthSizeUnit === "auto")
                        ? { widthSizeUnit: "px" }
                        : {}),
                  })
                }
              >
                {AXIS_SIZE_LABEL[mode]}
              </button>
            ))}
          </div>
          {p.widthSizeMode === "fixed" || p.widthSizeMode === "relative" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Width value</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  placeholder="—"
                  value={p.widthSizeValue ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v === "") {
                      updateNodeProps(node.id, { widthSizeValue: null });
                      return;
                    }
                    const n = Number(v);
                    updateNodeProps(node.id, { widthSizeValue: Number.isFinite(n) ? n : null });
                  }}
                />
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Width unit</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={p.widthSizeMode === "relative" ? "pct" : p.widthSizeUnit === "pct" ? "px" : p.widthSizeUnit}
                  onChange={(e) => {
                    const u = e.target.value as SizeUnit;
                    updateNodeProps(node.id, {
                      widthSizeUnit: u,
                      ...(u === "auto" ? { widthSizeValue: null } : {}),
                    });
                  }}
                  disabled={p.widthSizeMode === "relative"}
                >
                  {(p.widthSizeMode === "relative" ? (["pct"] as const) : FRAME_FIXED_SIZE_UNITS).map((u) => (
                    <option key={u} value={u}>
                      {sizeUnitLabel(u)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          <p className="ec-props-hint mb-1 mt-3 text-[11px] font-medium text-[var(--editor-text-muted)]">Height</p>
          <div className="grid grid-cols-2 gap-1">
            {AXIS_SIZE_MODES.map((mode) => (
              <button
                key={`h-${mode}`}
                type="button"
                className={`ec-tab-segment-btn rounded-md px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition-colors ${
                  p.heightSizeMode === mode ? "ec-tab-segment-btn-active" : ""
                }`}
                onClick={() =>
                  updateNodeProps(node.id, {
                    heightSizeMode: mode,
                    ...(mode === "relative"
                      ? { heightSizeUnit: "pct" }
                      : mode === "fixed" && (p.heightSizeUnit === "pct" || p.heightSizeUnit === "auto")
                        ? { heightSizeUnit: "px" }
                        : {}),
                  })
                }
              >
                {AXIS_SIZE_LABEL[mode]}
              </button>
            ))}
          </div>
          {p.heightSizeMode === "fixed" || p.heightSizeMode === "relative" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Height value</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  placeholder="—"
                  value={p.heightSizeValue ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v === "") {
                      updateNodeProps(node.id, { heightSizeValue: null });
                      return;
                    }
                    const n = Number(v);
                    updateNodeProps(node.id, { heightSizeValue: Number.isFinite(n) ? n : null });
                  }}
                />
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Height unit</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={p.heightSizeMode === "relative" ? "pct" : p.heightSizeUnit === "pct" ? "px" : p.heightSizeUnit}
                  onChange={(e) => {
                    const u = e.target.value as SizeUnit;
                    updateNodeProps(node.id, {
                      heightSizeUnit: u,
                      ...(u === "auto" ? { heightSizeValue: null } : {}),
                    });
                  }}
                  disabled={p.heightSizeMode === "relative"}
                >
                  {(p.heightSizeMode === "relative" ? (["pct"] as const) : FRAME_FIXED_SIZE_UNITS).map((u) => (
                    <option key={u} value={u}>
                      {sizeUnitLabel(u)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Min width (px)</span>
              <input
                type="text"
                inputMode="numeric"
                className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                placeholder="—"
                value={p.minWidthPx ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNodeProps(node.id, { minWidthPx: null });
                    return;
                  }
                  const n = Number(v);
                  updateNodeProps(node.id, { minWidthPx: Number.isFinite(n) ? n : null });
                }}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Max width (px)</span>
              <input
                type="text"
                inputMode="numeric"
                className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                placeholder="—"
                value={p.maxWidthPx ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNodeProps(node.id, { maxWidthPx: null });
                    return;
                  }
                  const n = Number(v);
                  updateNodeProps(node.id, { maxWidthPx: Number.isFinite(n) ? n : null });
                }}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Min height value</span>
              <input
                type="text"
                inputMode="decimal"
                className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                placeholder="—"
                value={p.minHeightValue ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNodeProps(node.id, { minHeightValue: null });
                    return;
                  }
                  const n = Number(v);
                  updateNodeProps(node.id, { minHeightValue: Number.isFinite(n) ? n : null });
                }}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Min height unit</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                value={p.minHeightUnit === "auto" ? "vh" : p.minHeightUnit}
                onChange={(e) => updateNodeProps(node.id, { minHeightUnit: e.target.value })}
              >
                {MIN_HEIGHT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {sizeUnitLabel(u)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </PropsSection>

        <PropsSection title="Layout">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Wie in Framer: <strong>Stack</strong> = Flex, <strong>Grid</strong> = CSS Grid. Gespeichert als{" "}
            <code className="font-mono text-[10px]">layoutType</code>, <code className="font-mono text-[10px]">direction</code>,{" "}
            <code className="font-mono text-[10px]">wrap</code>.
          </p>
          <div className="ec-tab-segment flex p-1" role="group" aria-label="Frame layout type">
            {layoutTypes.map((lt) => (
              <button
                key={lt}
                type="button"
                className={`ec-tab-segment-btn flex-1 rounded-md px-1 py-1.5 text-center text-[11px] font-medium capitalize transition-colors ${
                  p.layoutType === lt ? "ec-tab-segment-btn-active" : ""
                }`}
                onClick={() =>
                  updateNodeProps(node.id, {
                    layoutType: lt,
                    ...(lt === "grid" ? { wrap: false } : {}),
                  })
                }
              >
                {lt === "stack" ? "Stack" : "Grid"}
              </button>
            ))}
          </div>

          {p.layoutType === "stack" ? (
            <>
              <p className="ec-props-hint mt-3 mb-1 text-[11px] leading-relaxed">Direction</p>
              <div className="ec-tab-segment flex p-1" role="group" aria-label="Stack direction">
                {directions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`ec-tab-segment-btn flex-1 rounded-md px-1 py-1.5 text-center text-[11px] font-medium transition-colors ${
                      p.direction === d ? "ec-tab-segment-btn-active" : ""
                    }`}
                    onClick={() => updateNodeProps(node.id, { direction: d })}
                  >
                    {d === "vertical" ? "Vertical" : "Horizontal"}
                  </button>
                ))}
              </div>
              <p className="ec-props-hint mt-3 mb-1 text-[11px] leading-relaxed">Wrap</p>
              <div className="ec-tab-segment flex p-1" role="group" aria-label="Stack wrap">
                {([false, true] as const).map((w) => (
                  <button
                    key={w ? "yes" : "no"}
                    type="button"
                    className={`ec-tab-segment-btn flex-1 rounded-md px-1 py-1.5 text-center text-[11px] font-medium transition-colors ${
                      p.wrap === w ? "ec-tab-segment-btn-active" : ""
                    }`}
                    onClick={() => updateNodeProps(node.id, { wrap: w })}
                  >
                    {w ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <label className="ec-label mt-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Columns</span>
              <input
                type="number"
                min={1}
                max={12}
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.columns}
                onChange={(e) => updateNodeProps(node.id, { columns: Number(e.target.value) })}
              />
            </label>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Gap (px)</span>
              <input
                type="number"
                min={0}
                max={256}
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.gap}
                onChange={(e) => updateNodeProps(node.id, { gap: Number(e.target.value) })}
              />
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Padding (px)</span>
              <input
                type="number"
                min={0}
                max={256}
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.padding}
                onChange={(e) => updateNodeProps(node.id, { padding: Number(e.target.value) })}
              />
            </label>
          </div>

          {p.layoutType === "stack" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Align (cross)</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={p.align}
                  onChange={(e) => updateNodeProps(node.id, { align: e.target.value })}
                >
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="stretch">Stretch</option>
                </select>
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Distribute (main)</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={p.justify}
                  onChange={(e) => updateNodeProps(node.id, { justify: e.target.value })}
                >
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="between">Space between</option>
                  <option value="evenly">Space evenly</option>
                </select>
              </label>
            </div>
          ) : null}
        </PropsSection>

        <PropsSection title="Background">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Optional custom fill (Framer-style). Wenn gesetzt, ersetzt das den Flächen-Hintergrund der{" "}
            <strong>Surface</strong>-Voreinstellung — Rahmen und Text kommen weiter von Surface.
          </p>
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Fill type</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={
                !fillEditor
                  ? "none"
                  : fillEditor.kind === "solid"
                    ? "solid"
                    : fillEditor.kind === "linear"
                      ? "linear"
                      : fillEditor.kind === "radial"
                        ? "radial"
                        : fillEditor.kind === "conic"
                          ? "conic"
                          : "image"
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "none") {
                  updateNodeProps(node.id, { fill: null });
                  return;
                }
                if (v === "solid") {
                  updateNodeProps(node.id, { fill: { type: "solid", color: "#ffffff", opacity: 1 } });
                  return;
                }
                if (v === "linear") {
                  updateNodeProps(node.id, {
                    fill: {
                      type: "linear",
                      angle: 180,
                      stops: [
                        { color: "#000000", position: 0 },
                        { color: "#ffffff", position: 100 },
                      ],
                    },
                  });
                  return;
                }
                if (v === "radial") {
                  updateNodeProps(node.id, {
                    fill: {
                      type: "radial",
                      shape: "circle",
                      stops: [
                        { color: "#000000", position: 0 },
                        { color: "#ffffff", position: 100 },
                      ],
                    },
                  });
                  return;
                }
                if (v === "conic") {
                  updateNodeProps(node.id, {
                    fill: {
                      type: "conic",
                      angle: 0,
                      stops: [
                        { color: "#000000", position: 0 },
                        { color: "#ffffff", position: 100 },
                      ],
                    },
                  });
                  return;
                }
                updateNodeProps(node.id, {
                  fill: { type: "image", src: "https://placehold.co/600x400/e4e4e7/18181b?text=Fill", fit: "cover", position: "center" },
                });
              }}
            >
              <option value="none">None (surface only)</option>
              <option value="solid">Solid</option>
              <option value="linear">Linear gradient</option>
              <option value="radial">Radial gradient</option>
              <option value="conic">Conic gradient</option>
              <option value="image">Image</option>
            </select>
          </label>

          {fillEditor?.kind === "solid" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Color (hex)</span>
                <input
                  type="text"
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={fillEditor.color}
                  onChange={(e) =>
                    updateNodeProps(node.id, {
                      fill: { type: "solid", color: e.target.value, opacity: fillEditor.opacity },
                    })
                  }
                />
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Opacity (0–100%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={Math.round(fillEditor.opacity * 100)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateNodeProps(node.id, {
                      fill: {
                        type: "solid",
                        color: fillEditor.color,
                        opacity: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) / 100 : 1,
                      },
                    });
                  }}
                />
              </label>
            </div>
          ) : null}

          {fillEditor?.kind === "linear" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Angle (deg)</span>
                <input
                  type="number"
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={fillEditor.angle}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateNodeProps(node.id, {
                      fill: {
                        type: "linear",
                        angle: Number.isFinite(n) ? n : 180,
                        stops: fillEditor.stops,
                      },
                    });
                  }}
                />
              </label>
              {([0, 1] as const).map((idx) => (
                <div key={idx} className="contents">
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">{`Stop ${idx + 1} color`}</span>
                    <input
                      type="text"
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={fillEditor.stops[idx]?.color ?? "#000000"}
                      onChange={(e) => {
                        const stops = fillEditor.stops.map((s, i) =>
                          i === idx ? { ...s, color: e.target.value } : s,
                        );
                        updateNodeProps(node.id, { fill: { type: "linear", angle: fillEditor.angle, stops } });
                      }}
                    />
                  </label>
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">{`Stop ${idx + 1} %`}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={fillEditor.stops[idx]?.position ?? idx * 100}
                      onChange={(e) => {
                        const pos = Number(e.target.value);
                        const stops = fillEditor.stops.map((s, i) =>
                          i === idx ? { ...s, position: Number.isFinite(pos) ? pos : 0 } : s,
                        );
                        updateNodeProps(node.id, { fill: { type: "linear", angle: fillEditor.angle, stops } });
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : null}

          {fillEditor?.kind === "radial" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Shape</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={fillEditor.shape}
                  onChange={(e) =>
                    updateNodeProps(node.id, {
                      fill: {
                        type: "radial",
                        shape: e.target.value === "ellipse" ? "ellipse" : "circle",
                        stops: fillEditor.stops,
                      },
                    })
                  }
                >
                  <option value="circle">Circle</option>
                  <option value="ellipse">Ellipse</option>
                </select>
              </label>
              {([0, 1] as const).map((idx) => (
                <div key={idx} className="contents">
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">{`Stop ${idx + 1} color`}</span>
                    <input
                      type="text"
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={fillEditor.stops[idx]?.color ?? "#000000"}
                      onChange={(e) => {
                        const stops = fillEditor.stops.map((s, i) =>
                          i === idx ? { ...s, color: e.target.value } : s,
                        );
                        updateNodeProps(node.id, { fill: { type: "radial", shape: fillEditor.shape, stops } });
                      }}
                    />
                  </label>
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">{`Stop ${idx + 1} %`}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={fillEditor.stops[idx]?.position ?? idx * 100}
                      onChange={(e) => {
                        const pos = Number(e.target.value);
                        const stops = fillEditor.stops.map((s, i) =>
                          i === idx ? { ...s, position: Number.isFinite(pos) ? pos : 0 } : s,
                        );
                        updateNodeProps(node.id, { fill: { type: "radial", shape: fillEditor.shape, stops } });
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : null}

          {fillEditor?.kind === "conic" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Start angle (deg)</span>
                <input
                  type="number"
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={fillEditor.angle}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateNodeProps(node.id, {
                      fill: {
                        type: "conic",
                        angle: Number.isFinite(n) ? n : 0,
                        stops: fillEditor.stops,
                      },
                    });
                  }}
                />
              </label>
              {([0, 1] as const).map((idx) => (
                <div key={idx} className="contents">
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">{`Stop ${idx + 1} color`}</span>
                    <input
                      type="text"
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={fillEditor.stops[idx]?.color ?? "#000000"}
                      onChange={(e) => {
                        const stops = fillEditor.stops.map((s, i) =>
                          i === idx ? { ...s, color: e.target.value } : s,
                        );
                        updateNodeProps(node.id, { fill: { type: "conic", angle: fillEditor.angle, stops } });
                      }}
                    />
                  </label>
                  <label className="ec-label flex flex-col gap-1 text-[11px]">
                    <span className="ec-text-muted">{`Stop ${idx + 1} %`}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                      value={fillEditor.stops[idx]?.position ?? idx * 100}
                      onChange={(e) => {
                        const pos = Number(e.target.value);
                        const stops = fillEditor.stops.map((s, i) =>
                          i === idx ? { ...s, position: Number.isFinite(pos) ? pos : 0 } : s,
                        );
                        updateNodeProps(node.id, { fill: { type: "conic", angle: fillEditor.angle, stops } });
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : null}

          {fillEditor?.kind === "image" ? (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Image URL (https or data:image…)</span>
                <input
                  type="url"
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[11px]"
                  value={fillEditor.src}
                  onChange={(e) =>
                    updateNodeProps(node.id, {
                      fill: { type: "image", src: e.target.value, fit: fillEditor.fit, position: fillEditor.position },
                    })
                  }
                />
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Size</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={fillEditor.fit}
                  onChange={(e) =>
                    updateNodeProps(node.id, {
                      fill: {
                        type: "image",
                        src: fillEditor.src,
                        fit: e.target.value as "cover" | "contain" | "fill" | "none",
                        position: fillEditor.position,
                      },
                    })
                  }
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                  <option value="fill">fill</option>
                  <option value="none">none</option>
                </select>
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Position</span>
                <input
                  type="text"
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={fillEditor.position}
                  onChange={(e) =>
                    updateNodeProps(node.id, {
                      fill: { type: "image", src: fillEditor.src, fit: fillEditor.fit, position: e.target.value },
                    })
                  }
                />
              </label>
            </div>
          ) : null}
        </PropsSection>

        <PropsSection title="Styles">
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <p className="ec-props-hint mb-1 text-[11px] leading-relaxed">Visible</p>
              <div className="ec-tab-segment flex p-1" role="group" aria-label="Frame visible">
                {([true, false] as const).map((v) => (
                  <button
                    key={v ? "yes" : "no"}
                    type="button"
                    className={`ec-tab-segment-btn flex-1 rounded-md px-1 py-1.5 text-center text-[11px] font-medium transition-colors ${
                      p.visible === v ? "ec-tab-segment-btn-active" : ""
                    }`}
                    onClick={() => updateNodeProps(node.id, { visible: v })}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
            <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Surface (Rahmen & Text)</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.surface}
                onChange={(e) => updateNodeProps(node.id, { surface: e.target.value })}
              >
                {FRAME_SURFACE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Overflow</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.overflow}
                onChange={(e) => updateNodeProps(node.id, { overflow: e.target.value })}
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="auto">Auto</option>
                <option value="scroll">Scroll</option>
                <option value="clip">Clip</option>
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Radius (px)</span>
              <input
                type="number"
                min={0}
                max={48}
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                value={p.radius}
                onChange={(e) => updateNodeProps(node.id, { radius: Number(e.target.value) })}
              />
            </label>
            <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Z-index</span>
              <input
                type="text"
                inputMode="numeric"
                className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
                placeholder="auto"
                value={p.zIndex ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNodeProps(node.id, { zIndex: null });
                    return;
                  }
                  const n = Number(v);
                  updateNodeProps(node.id, { zIndex: Number.isFinite(n) ? n : null });
                }}
              />
            </label>
          </div>
        </PropsSection>

        <PropsSection title="Motion">
          <MotionPropsFields nodeId={node.id} motion={p} updateNodeProps={updateNodeProps} />
        </PropsSection>

        <PropsSection title="Interaction">
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Pointer events</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.pointerEvents}
                onChange={(e) => updateNodeProps(node.id, { pointerEvents: e.target.value })}
              >
                <option value="auto">auto</option>
                <option value="none">none</option>
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Cursor</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.cursor ?? "default"}
                onChange={(e) => updateNodeProps(node.id, { cursor: e.target.value as CursorToken })}
              >
                {CURSOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">User select</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.userSelect}
                onChange={(e) => updateNodeProps(node.id, { userSelect: e.target.value })}
              >
                <option value="auto">auto</option>
                <option value="none">none</option>
                <option value="text">text</option>
                <option value="all">all</option>
              </select>
            </label>
          </div>
        </PropsSection>

        <PropsSection title="Responsive (min-width)">
          <p className="ec-props-hint mb-2 text-[11px] leading-relaxed">
            Overrides ab jeweils{" "}
            <span className="font-mono">
              sm {FRAME_BREAKPOINT_MIN_PX.sm}px, md {FRAME_BREAKPOINT_MIN_PX.md}px, lg {FRAME_BREAKPOINT_MIN_PX.lg}px
            </span>
            . Leere Felder entfernen den Wert; Sichtbarkeit „—“ = kein Override.
          </p>
          {(["sm", "md", "lg"] as const).map((bp, idx) => {
            const vis = readFrameWhenVisible(node.props, bp);
            const visVal = vis === "inherit" ? "" : vis ? "1" : "0";
            return (
            <div
              key={bp}
              className={`ec-props-subgrid grid grid-cols-2 gap-2 ${idx > 0 ? "mt-2 border-t border-zinc-200/60 pt-2" : ""}`}
            >
              <p className="ec-text-muted col-span-2 text-[10px] font-semibold uppercase tracking-wide">{bp}</p>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Gap (px)</span>
                <input
                  type="number"
                  min={0}
                  max={256}
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={readFrameWhenNumber(node.props, bp, "gap")}
                  placeholder="—"
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                      if (v === "") {
                        delete s.gap;
                      } else {
                        const n = Number(v);
                        if (Number.isFinite(n)) {
                          s.gap = Math.min(256, Math.max(0, Math.round(n)));
                        }
                      }
                    });
                    updateNodeProps(node.id, { when: nextWhen });
                  }}
                />
              </label>
              <label className="ec-label flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Padding (px)</span>
                <input
                  type="number"
                  min={0}
                  max={256}
                  className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                  value={readFrameWhenNumber(node.props, bp, "padding")}
                  placeholder="—"
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                      if (v === "") {
                        delete s.padding;
                      } else {
                        const n = Number(v);
                        if (Number.isFinite(n)) {
                          s.padding = Math.min(256, Math.max(0, Math.round(n)));
                        }
                      }
                    });
                    updateNodeProps(node.id, { when: nextWhen });
                  }}
                />
              </label>
              {p.layoutType === "grid" ? (
                <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Columns</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className="ec-input rounded-md px-2 py-1.5 font-mono text-[12px]"
                    value={readFrameWhenNumber(node.props, bp, "columns")}
                    placeholder="—"
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                        if (v === "") {
                          delete s.columns;
                        } else {
                          const n = Number(v);
                          if (Number.isFinite(n)) {
                            s.columns = Math.min(12, Math.max(1, Math.round(n)));
                          }
                        }
                      });
                      updateNodeProps(node.id, { when: nextWhen });
                    }}
                  />
                </label>
              ) : null}
              <label className="ec-label col-span-2 flex flex-col gap-1 text-[11px]">
                <span className="ec-text-muted">Visible override</span>
                <select
                  className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                  value={visVal}
                  onChange={(e) => {
                    const v = e.target.value;
                    const nextWhen = mergeFrameWhenBreakpoint(node.props, bp, (s) => {
                      if (v === "") {
                        delete s.visible;
                      } else {
                        s.visible = v === "1";
                      }
                    });
                    updateNodeProps(node.id, { when: nextWhen });
                  }}
                >
                  <option value="">— (inherit)</option>
                  <option value="1">Visible</option>
                  <option value="0">Hidden</option>
                </select>
              </label>
            </div>
            );
          })}
        </PropsSection>

        <PropsSection title="Add blocks">
          <AddBlockButtonGrid nodeId={node.id} addChildTo={addChildTo} />
        </PropsSection>

        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  if (node.type === "container") {
    const p = normalizeContainerProps(node.props);
    return (
      <div className="ec-props-stack">
        <PropsSection title="Size">
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="ec-label flex flex-col gap-1 text-[11px]">
              <span className="ec-text-muted">Height mode</span>
              <select
                className="ec-input rounded-md px-2 py-1.5 text-[12px]"
                value={p.heightMode}
                onChange={(e) => updateNodeProps(node.id, { heightMode: e.target.value as ContainerHeightMode })}
              >
                <option value="fit">Fit content</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            {p.heightMode === "fixed" ? (
              <div className="flex items-end gap-1">
                <label className="ec-label flex min-w-0 flex-1 flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Value</span>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    className="ec-input w-full min-w-0 rounded-md px-2 py-1.5 font-mono text-[12px]"
                    value={p.heightValue ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === "") {
                        updateNodeProps(node.id, { heightValue: null });
                        return;
                      }
                      const n = Number(v);
                      updateNodeProps(node.id, { heightValue: Number.isFinite(n) ? n : null });
                    }}
                  />
                </label>
                <label className="ec-label flex min-w-0 flex-1 flex-col gap-1 text-[11px]">
                  <span className="ec-text-muted">Unit</span>
                  <select
                    className="ec-input w-full min-w-0 rounded-md px-2 py-1.5 font-mono text-[12px]"
                    value={p.heightUnit}
                    onChange={(e) => updateNodeProps(node.id, { heightUnit: e.target.value })}
                  >
                    <option value="px">px</option>
                    <option value="vh">vh</option>
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </PropsSection>
        <PropsSection title="Appearance">
          <label className="ec-label mt-1 flex flex-col gap-1 text-[11px]">
            <span className="ec-text-muted">Surface</span>
            <select
              className="ec-input rounded-md px-2 py-1.5 text-[12px]"
              value={p.surface}
              onChange={(e) => updateNodeProps(node.id, { surface: e.target.value })}
            >
              {FRAME_SURFACE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </PropsSection>
        <PropsSection title="Layout">
          <p className="ec-props-hint text-[12px] leading-relaxed">
            Root uses a simple container shell. Add <strong>sections</strong>, <strong>frames</strong>, or <strong>split</strong>{" "}
            for layout, or add content blocks directly.
          </p>
          <div className="mt-3">
            <AddBlockButtonGrid nodeId={node.id} addChildTo={addChildTo} />
          </div>
        </PropsSection>
        {node.id !== "root" ? (
          <section className="ec-props-section">
            <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
              Remove layer
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ec-props-stack">
      <PropsSection title="Data">
        <p className="ec-props-hint mb-2 text-[12px] leading-relaxed">
          Unknown type <span className="ec-caution-code font-mono">{node.type}</span> — read-only.
        </p>
        <pre className="ec-code-block ec-props-code max-h-48 overflow-auto rounded-lg p-2.5 text-[11px] leading-relaxed">
          {JSON.stringify(node.props, null, 2)}
        </pre>
      </PropsSection>
      {node.id !== "root" ? (
        <section className="ec-props-section">
          <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
            Remove layer
          </button>
        </section>
      ) : null}
    </div>
  );
}

type LeftTab = "pages" | "layers" | "assets";

export function EditorApp({ initialSlug }: { initialSlug: string }) {
  const router = useRouter();
  const slug = useEditorStore((s) => s.slug);
  const document = useEditorStore((s) => s.document);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const status = useEditorStore((s) => s.status);
  const lastError = useEditorStore((s) => s.lastError);
  const isDirty = useEditorStore((s) => s.isDirty);
  const previewNonce = useEditorStore((s) => s.previewNonce);
  const loadPage = useEditorStore((s) => s.loadPage);
  const savePage = useEditorStore((s) => s.savePage);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());
  const selectNode = useEditorStore((s) => s.selectNode);
  const reorderNodesByIds = useEditorStore((s) => s.reorderNodesByIds);
  const updateNodeName = useEditorStore((s) => s.updateNodeName);
  const duplicateSelectedNode = useEditorStore((s) => s.duplicateSelectedNode);
  const getClipboardPayloadForSelectedNode = useEditorStore((s) => s.getClipboardPayloadForSelectedNode);
  const pasteFromClipboardText = useEditorStore((s) => s.pasteFromClipboardText);
  const moveSelectedNode = useEditorStore((s) => s.moveSelectedNode);
  const canMoveSelectedNodeUp = useEditorStore((s) => s.canMoveSelectedNode("up"));
  const canMoveSelectedNodeDown = useEditorStore((s) => s.canMoveSelectedNode("down"));
  const removeSelectedNode = useEditorStore((s) => s.removeSelectedNode);

  const [leftTab, setLeftTab] = useState<LeftTab>("layers");
  const [leftSearch, setLeftSearch] = useState("");
  const [collapsedLayerIds, setCollapsedLayerIds] = useState<Set<string>>(() => new Set());
  const [pageSlugs, setPageSlugs] = useState<string[]>([]);
  const [pageListError, setPageListError] = useState<string | null>(null);
  const [pageListLoading, setPageListLoading] = useState(true);
  const [isAddingPageRow, setIsAddingPageRow] = useState(false);
  const [newSlugDraft, setNewSlugDraft] = useState("");
  const [newSlugError, setNewSlugError] = useState<string | null>(null);
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const draftIframeRef = useRef<HTMLIFrameElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const panPointerRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  /** True while Space is held (hand tool) — ref for pointer handlers without stale closures. */
  const previewHandToolRef = useRef(false);
  /** Mirrors `previewZoom` for Safari `GestureEvent` handlers (no stale closure). */
  const previewZoomRef = useRef(0.35);
  const pinchGestureStartZoomRef = useRef(0.35);

  const [previewBpId, setPreviewBpId] = useState("desktop");
  const [customPreviewBreakpoints, setCustomPreviewBreakpoints] = useState<EditorPreviewBreakpoint[]>([]);
  const [newBpWidth, setNewBpWidth] = useState("1440");
  const [newBpHeight, setNewBpHeight] = useState("900");
  const [previewZoom, setPreviewZoom] = useState(0.35);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [previewHandTool, setPreviewHandTool] = useState(false);
  const [isPreviewPanning, setIsPreviewPanning] = useState(false);

  const [previewFitContentHeight, setPreviewFitContentHeight] = useState<number | null>(null);

  const newSlugInputRef = useRef<HTMLInputElement>(null);
  const skipNewSlugBlurCommitRef = useRef(false);
  const isAddingPageRowRef = useRef(false);
  const previewAddDetailsRef = useRef<HTMLDetailsElement>(null);

  const fetchPageSlugs = useCallback(async () => {
    try {
      const res = await fetch("/api/pages");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "slugs" in body && Array.isArray((body as { slugs: unknown }).slugs)) {
        const list = (body as { slugs: unknown[] }).slugs.filter((x): x is string => typeof x === "string");
        setPageSlugs(list);
      } else {
        setPageSlugs([]);
      }
      setPageListError(null);
    } catch (e) {
      setPageListError(e instanceof Error ? e.message : "Failed to load page list");
      setPageSlugs([]);
    } finally {
      setPageListLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPageSlugs();
  }, [fetchPageSlugs, previewNonce, slug]);

  const displaySlugs = useMemo(() => {
    const set = new Set(pageSlugs);
    if (slug) {
      set.add(slug);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [pageSlugs, slug]);

  const trySwitchPage = useCallback(
    (nextSlug: string): boolean => {
      if (nextSlug === slug) {
        return true;
      }
      if (isDirty && !window.confirm(UNSAVED_NAV_MESSAGE)) {
        return false;
      }
      router.replace(`/admin/editor?slug=${encodeURIComponent(nextSlug)}`);
      return true;
    },
    [slug, isDirty, router],
  );

  const closeNewPageRow = useCallback(() => {
    isAddingPageRowRef.current = false;
    setIsAddingPageRow(false);
    setNewSlugDraft("");
    setNewSlugError(null);
  }, []);

  const commitNewSlugFromInput = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        closeNewPageRow();
        return;
      }
      if (!isSafePageSlug(trimmed)) {
        setNewSlugError("Letters, numbers, _ and - only (max 128). Must start with a letter or digit.");
        newSlugInputRef.current?.focus();
        return;
      }
      setNewSlugError(null);
      if (!trySwitchPage(trimmed)) {
        newSlugInputRef.current?.focus();
        return;
      }
      closeNewPageRow();
    },
    [closeNewPageRow, trySwitchPage],
  );

  const startAddPageRow = useCallback(() => {
    if (isAddingPageRowRef.current) {
      newSlugInputRef.current?.focus();
      newSlugInputRef.current?.select();
      return;
    }
    isAddingPageRowRef.current = true;
    setNewSlugError(null);
    setNewSlugDraft("");
    setIsAddingPageRow(true);
  }, []);

  useEffect(() => {
    if (!isAddingPageRow) {
      return;
    }
    newSlugInputRef.current?.focus();
    newSlugInputRef.current?.select();
  }, [isAddingPageRow]);

  useEffect(() => {
    if (leftTab !== "pages") {
      skipNewSlugBlurCommitRef.current = true;
      closeNewPageRow();
    }
  }, [leftTab, closeNewPageRow]);

  const layersTreeRoot = useMemo(() => {
    if (!document) {
      return null;
    }
    const q = leftSearch.trim();
    if (!q) {
      return document.root;
    }
    return filterPageNodeTree(document.root, q);
  }, [document, leftSearch]);
  const visibleTreeRows = useMemo(() => {
    if (!layersTreeRoot) {
      return [] as TreeDndRow[];
    }
    return flattenVisibleTree(layersTreeRoot, collapsedLayerIds);
  }, [collapsedLayerIds, layersTreeRoot]);

  useEffect(() => {
    const customs = loadCustomEditorPreviewBreakpoints();
    setCustomPreviewBreakpoints(customs);
    const saved = loadStoredPreviewBreakpointId();
    const merged = [...BUILTIN_EDITOR_PREVIEW_BREAKPOINTS, ...customs];
    if (saved && merged.some((b) => b.id === saved)) {
      setPreviewBpId(saved);
    }
  }, []);

  const previewBreakpoints = useMemo(
    () => [...BUILTIN_EDITOR_PREVIEW_BREAKPOINTS, ...customPreviewBreakpoints],
    [customPreviewBreakpoints],
  );

  const activePreviewBp = useMemo(() => {
    return previewBreakpoints.find((b) => b.id === previewBpId) ?? BUILTIN_EDITOR_PREVIEW_BREAKPOINTS[0];
  }, [previewBreakpoints, previewBpId]);

  const previewCanvasHeight = useMemo(() => {
    const docNow = document;
    const p = docNow ? docNow.root.props : {};
    const hm = typeof p.heightMode === "string" ? p.heightMode : "fit";
    if (hm === "fixed") {
      const hv = typeof p.heightValue === "number" ? p.heightValue : 100;
      const hu = typeof p.heightUnit === "string" ? p.heightUnit : "vh";
      if (hu === "vh") {
        return Math.max(240, (activePreviewBp.height * hv) / 100);
      }
      return Math.max(240, hv);
    }
    /**
     * Never shrink the transform canvas below the active preset height: `previewFitContentHeight`
     * is intrinsic content size and can be shorter than 1080/844/… before `--openframe-vh` applies
     * or when layout is still settling — that made 1920×1080 read as 1920×~400 and broke aspect + Fit.
     */
    if (previewFitContentHeight != null && previewFitContentHeight > 0) {
      return Math.max(activePreviewBp.height, previewFitContentHeight);
    }
    return activePreviewBp.height;
  }, [document, activePreviewBp.height, previewFitContentHeight]);

  const { inline: bpInline, overflow: bpOverflow } = useMemo(
    () => splitPreviewBreakpointsForChrome(previewBreakpoints, previewBpId),
    [previewBreakpoints, previewBpId],
  );

  const selectPreviewBreakpoint = useCallback((id: string) => {
    setPreviewBpId(id);
    saveStoredPreviewBreakpointId(id);
  }, []);

  useEffect(() => {
    if (!previewBreakpoints.some((b) => b.id === previewBpId)) {
      const fallback = BUILTIN_EDITOR_PREVIEW_BREAKPOINTS[0].id;
      setPreviewBpId(fallback);
      saveStoredPreviewBreakpointId(fallback);
    }
  }, [previewBreakpoints, previewBpId]);

  const addCustomPreviewBreakpoint = useCallback(() => {
    const w = Number(newBpWidth);
    const h = Number(newBpHeight);
    if (!Number.isFinite(w) || !Number.isFinite(h)) {
      return;
    }
    const dims = clampPreviewBreakpointDims(w, h);
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `custom-${crypto.randomUUID()}`
        : `custom-${Date.now()}`;
    const label = `${dims.width}×${dims.height}`;
    const created: EditorPreviewBreakpoint = { id, label, width: dims.width, height: dims.height, builtIn: false };
    setCustomPreviewBreakpoints((prev) => {
      const next = [...prev, created];
      saveCustomEditorPreviewBreakpoints(next);
      return next;
    });
    selectPreviewBreakpoint(id);
    previewAddDetailsRef.current?.removeAttribute("open");
  }, [newBpWidth, newBpHeight, selectPreviewBreakpoint]);

  const removeCustomPreviewBreakpoint = useCallback(
    (id: string) => {
      setCustomPreviewBreakpoints((prev) => {
        const next = prev.filter((b) => b.id !== id);
        saveCustomEditorPreviewBreakpoints(next);
        return next;
      });
      setPreviewBpId((current) => {
        if (current !== id) {
          return current;
        }
        const fb = BUILTIN_EDITOR_PREVIEW_BREAKPOINTS[0].id;
        saveStoredPreviewBreakpointId(fb);
        return fb;
      });
    },
    [],
  );

  const pushDraftToIframe = useCallback(() => {
    const doc = useEditorStore.getState().document;
    if (!doc) {
      return;
    }
    postDraftToPreview(
      draftIframeRef.current,
      doc,
      window.location.origin,
      activePreviewBp.height,
      activePreviewBp.width,
    );
  }, [activePreviewBp.height, activePreviewBp.width]);

  useEffect(() => {
    void loadPage(initialSlug);
  }, [initialSlug, loadPage]);

  useEffect(() => {
    if (!document) {
      return;
    }
    const id = window.setTimeout(() => pushDraftToIframe(), 120);
    return () => window.clearTimeout(id);
  }, [document, pushDraftToIframe]);

  useEffect(() => {
    setPreviewFitContentHeight(null);
  }, [document]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) {
        return;
      }
      if (!isPreviewContentSizeMessage(ev.data)) {
        return;
      }
      if (ev.source !== draftIframeRef.current?.contentWindow) {
        return;
      }
      setPreviewFitContentHeight(ev.data.payload.height);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const busy = status === "loading" || status === "saving";

  const selectedNode = useMemo(() => {
    if (!document || !selectedNodeId) {
      return null;
    }
    return findNodeById(document.root, selectedNodeId);
  }, [document, selectedNodeId]);
  const treeDndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const treeDndEnabled = leftSearch.trim() === "";
  const nodeMaps = useMemo(() => (document ? buildNodeMaps(document.root) : { nodeById: new Map<string, PageNode>(), parentIdByNodeId: new Map<string, string | null>() }), [document]);
  const flatNodesById = nodeMaps.nodeById;
  const parentIdByNodeId = nodeMaps.parentIdByNodeId;
  const toggleLayerCollapse = useCallback((id: string) => {
    setCollapsedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  const isLayerCollapsed = useCallback((id: string) => collapsedLayerIds.has(id), [collapsedLayerIds]);
  const expandLayer = useCallback((id: string) => {
    setCollapsedLayerIds((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const treeDnd = useTreeDnd({
    documentRoot: treeDndEnabled ? document?.root ?? null : null,
    canParentAcceptChild,
    isCollapsed: isLayerCollapsed,
    onAutoExpand: expandLayer,
  });
  const treeBoxRef = useRef<HTMLDivElement | null>(null);
  const rowElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const registerRowEl = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      rowElsRef.current.set(id, el);
    } else {
      rowElsRef.current.delete(id);
    }
  }, []);
  const onLayerTreeDragEnd = useCallback(
    (event: DragEndEvent) => {
      const result = treeDnd.consumeDrop(event);
      if (!result) {
        return;
      }
      reorderNodesByIds(result.activeId, result.slot.overNodeId, result.slot.placement);
    },
    [reorderNodesByIds, treeDnd],
  );

  const applyPreviewFit = useCallback(() => {
    const el = previewViewportRef.current;
    if (!el || el.clientWidth < 8 || el.clientHeight < 8) {
      return;
    }
    const bp = previewBreakpoints.find((b) => b.id === previewBpId) ?? BUILTIN_EDITOR_PREVIEW_BREAKPOINTS[0];
    const pad = 40;
    const z = Math.min(Math.max((el.clientWidth - pad) / bp.width, 0.06), 2.5);
    setPreviewZoom(z);
    setPreviewPan((p) => ({ x: 0, y: p.y }));
  }, [previewBpId, previewBreakpoints]);

  useEffect(() => {
    const onEditorShortcut = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) {
        return;
      }
      const key = e.key.toLowerCase();
      const isSave = key === "s" || e.code === "KeyS";
      const isUndo = key === "z" || e.code === "KeyZ";
      const isRedo = (isUndo && e.shiftKey) || key === "y" || e.code === "KeyY";
      const isDuplicate = key === "d" || e.code === "KeyD";
      if (!isSave && !isUndo && !isRedo && !isDuplicate) {
        return;
      }
      const dom = globalThis.document;
      if (!dom) {
        return;
      }
      const chrome = dom.querySelector("[data-editor-chrome]");
      if (!chrome) {
        return;
      }
      const ae = dom.activeElement;
      const target = e.target;
      /** Clicks on empty chrome often leave focus on `body` — still treat as in-editor. */
      const inEditor =
        (ae instanceof Node && chrome.contains(ae)) ||
        ae === dom.body ||
        ae === dom.documentElement ||
        (target instanceof Node && chrome.contains(target));

      if (!inEditor) {
        return;
      }
      const shouldIgnoreMutationShortcut =
        ae instanceof HTMLElement &&
        (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable);

      // Capture phase + default prevention so Safari/Chrome never open “Save Page” on this route.
      e.preventDefault();
      e.stopPropagation();

      const state = useEditorStore.getState();
      if (isSave) {
        const saveBusy = state.status === "loading" || state.status === "saving";
        if (saveBusy || !state.document || !state.isDirty) {
          return;
        }
        void state.savePage();
        return;
      }
      if (isRedo) {
        if (shouldIgnoreMutationShortcut) {
          return;
        }
        state.redo();
        return;
      }
      if (isUndo) {
        if (shouldIgnoreMutationShortcut) {
          return;
        }
        state.undo();
        return;
      }
      if (isDuplicate) {
        if (shouldIgnoreMutationShortcut) {
          return;
        }
        const selectedId = state.selectedNodeId;
        if (!state.document || !selectedId || selectedId === state.document.root.id) {
          return;
        }
        state.duplicateSelectedNode();
      }
    };

    const onDeleteShortcut = (e: KeyboardEvent) => {
      const isDelete = e.key === "Delete" || e.key === "Backspace";
      if (!isDelete) {
        return;
      }
      const dom = globalThis.document;
      if (!dom) {
        return;
      }
      const chrome = dom.querySelector("[data-editor-chrome]");
      if (!chrome) {
        return;
      }
      const ae = dom.activeElement;
      const target = e.target;
      const inEditor =
        (ae instanceof Node && chrome.contains(ae)) ||
        ae === dom.body ||
        ae === dom.documentElement ||
        (target instanceof Node && chrome.contains(target));
      if (!inEditor) {
        return;
      }
      const typingTarget =
        ae instanceof HTMLElement &&
        (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable);
      if (typingTarget) {
        return;
      }
      const state = useEditorStore.getState();
      const selectedId = state.selectedNodeId;
      if (!state.document || !selectedId || selectedId === state.document.root.id) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      state.removeSelectedNode();
    };

    window.addEventListener("keydown", onEditorShortcut, { capture: true });
    window.addEventListener("keydown", onDeleteShortcut, { capture: true });
    return () => {
      window.removeEventListener("keydown", onEditorShortcut, { capture: true });
      window.removeEventListener("keydown", onDeleteShortcut, { capture: true });
    };
  }, []);

  useEffect(() => {
    const dom = globalThis.document;
    if (!dom) {
      return;
    }
    const chrome = dom.querySelector("[data-editor-chrome]");
    if (!chrome) {
      return;
    }

    const isNativeTextTarget = (target: EventTarget | null) => {
      const el = target instanceof HTMLElement ? target : null;
      if (!el) {
        return false;
      }
      if (el.isContentEditable) {
        return true;
      }
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const onCopy = (e: Event) => {
      if (!(e instanceof ClipboardEvent)) {
        return;
      }
      if (isNativeTextTarget(e.target)) {
        return;
      }
      const payload = useEditorStore.getState().getClipboardPayloadForSelectedNode();
      if (!payload) {
        return;
      }
      e.preventDefault();
      e.clipboardData?.setData("text/plain", payload);
    };

    const onCut = (e: Event) => {
      if (!(e instanceof ClipboardEvent)) {
        return;
      }
      if (isNativeTextTarget(e.target)) {
        return;
      }
      const payload = useEditorStore.getState().getClipboardPayloadForSelectedNode();
      if (!payload) {
        return;
      }
      e.preventDefault();
      e.clipboardData?.setData("text/plain", payload);
      useEditorStore.getState().removeSelectedNode();
    };

    const onPaste = (e: Event) => {
      if (!(e instanceof ClipboardEvent)) {
        return;
      }
      if (isNativeTextTarget(e.target)) {
        return;
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!decodeLayerClipboard(text)) {
        return;
      }
      const ok = useEditorStore.getState().pasteFromClipboardText(text);
      if (ok) {
        e.preventDefault();
      }
    };

    chrome.addEventListener("copy", onCopy, true);
    chrome.addEventListener("cut", onCut, true);
    chrome.addEventListener("paste", onPaste, true);
    return () => {
      chrome.removeEventListener("copy", onCopy, true);
      chrome.removeEventListener("cut", onCut, true);
      chrome.removeEventListener("paste", onPaste, true);
    };
  }, []);

  useEffect(() => {
    const shouldReserveSpace = () => {
      const dom = globalThis.document;
      if (typeof dom === "undefined" || dom === null) {
        return true;
      }
      const ae = dom.activeElement;
      if (!ae || !(ae instanceof HTMLElement)) {
        return false;
      }
      const tag = ae.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      if (ae.isContentEditable) {
        return true;
      }
      if (tag === "BUTTON" || tag === "A") {
        return true;
      }
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) {
        return;
      }
      if (shouldReserveSpace()) {
        return;
      }
      e.preventDefault();
      previewHandToolRef.current = true;
      setPreviewHandTool(true);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") {
        return;
      }
      previewHandToolRef.current = false;
      setPreviewHandTool(false);
    };

    const resetHand = () => {
      previewHandToolRef.current = false;
      setPreviewHandTool(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", resetHand);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", resetHand);
    };
  }, []);

  useEffect(() => {
    const dom = globalThis.document;
    if (!dom) {
      return;
    }

    const getViewport = () => previewViewportRef.current;

    const isOverPreview = (e: { clientX: number; clientY: number }) => {
      const el = getViewport();
      if (!el?.isConnected) {
        return false;
      }
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };

    const panSensitivity = 0.92;
    const panThreshold = 0.05;

    const applyPreviewWheelPixels = (dx: number, dy: number, pinch: boolean) => {
      if (pinch) {
        setPreviewZoom((prev) => {
          const next = prev * Math.exp(-dy * 0.0018);
          return Math.min(2.5, Math.max(0.06, next));
        });
        return;
      }
      if (Math.abs(dx) < panThreshold && Math.abs(dy) < panThreshold) {
        return;
      }
      setPreviewPan((p) => ({
        x: p.x - dx * panSensitivity,
        y: p.y - dy * panSensitivity,
      }));
    };

    const onWheelCapture = (e: WheelEvent) => {
      if (!isOverPreview(e)) {
        return;
      }

      const el = getViewport();
      const { dx, dy } = normalizeWheelPixelDeltas(
        e.deltaX,
        e.deltaY,
        e.deltaMode,
        el?.clientWidth ?? null,
        el?.clientHeight ?? null,
      );

      const pinch = isPinchZoomWheelEvent(e);
      if (pinch) {
        e.preventDefault();
        e.stopPropagation();
        applyPreviewWheelPixels(dx, dy, true);
        return;
      }

      if (Math.abs(dx) < panThreshold && Math.abs(dy) < panThreshold) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      applyPreviewWheelPixels(dx, dy, false);
    };

    const onIframeBridgeMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) {
        return;
      }
      if (ev.source !== draftIframeRef.current?.contentWindow) {
        return;
      }

      if (isPreviewWheelBridgeMessage(ev.data)) {
        const el = getViewport();
        const { dx, dy } = normalizeWheelPixelDeltas(
          ev.data.payload.deltaX,
          ev.data.payload.deltaY,
          ev.data.payload.deltaMode,
          el?.clientWidth ?? null,
          el?.clientHeight ?? null,
        );
        const pinch = isPinchZoomWheelFlags(ev.data.payload.ctrlKey, ev.data.payload.metaKey);
        applyPreviewWheelPixels(dx, dy, pinch);
        return;
      }

      if (isPreviewPinchBridgeMessage(ev.data)) {
        const p = ev.data.payload;
        if (p.phase === "start") {
          pinchGestureStartZoomRef.current = previewZoomRef.current;
        } else if (p.phase === "change") {
          const z0 = pinchGestureStartZoomRef.current;
          setPreviewZoom(Math.min(2.5, Math.max(0.06, z0 * p.scale)));
        }
      }
    };

    dom.addEventListener("wheel", onWheelCapture, { passive: false, capture: true });
    window.addEventListener("message", onIframeBridgeMessage);

    const hasSafariGesture = "GestureEvent" in globalThis;

    type SafariGestureEvent = Event & { readonly scale: number; readonly clientX: number; readonly clientY: number };

    const onGestureStart = (e: Event) => {
      if (!hasSafariGesture) {
        return;
      }
      const ge = e as SafariGestureEvent;
      if (!isOverPreview(ge)) {
        return;
      }
      ge.preventDefault();
      pinchGestureStartZoomRef.current = previewZoomRef.current;
    };

    const onGestureChange = (e: Event) => {
      if (!hasSafariGesture) {
        return;
      }
      const ge = e as SafariGestureEvent;
      if (!isOverPreview(ge)) {
        return;
      }
      ge.preventDefault();
      const z0 = pinchGestureStartZoomRef.current;
      const next = Math.min(2.5, Math.max(0.06, z0 * ge.scale));
      setPreviewZoom(next);
    };

    const onGestureEnd = (e: Event) => {
      if (!hasSafariGesture) {
        return;
      }
      const ge = e as SafariGestureEvent;
      if (!isOverPreview(ge)) {
        return;
      }
      ge.preventDefault();
    };

    if (hasSafariGesture) {
      dom.addEventListener("gesturestart", onGestureStart, { capture: true, passive: false });
      dom.addEventListener("gesturechange", onGestureChange, { capture: true, passive: false });
      dom.addEventListener("gestureend", onGestureEnd, { capture: true, passive: false });
    }

    return () => {
      dom.removeEventListener("wheel", onWheelCapture, true);
      window.removeEventListener("message", onIframeBridgeMessage);
      if (hasSafariGesture) {
        dom.removeEventListener("gesturestart", onGestureStart, true);
        dom.removeEventListener("gesturechange", onGestureChange, true);
        dom.removeEventListener("gestureend", onGestureEnd, true);
      }
    };
  }, []);

  const onPreviewViewportPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const panWithPrimary = e.button === 0 && (e.altKey || previewHandToolRef.current);
    if (e.button !== 1 && !panWithPrimary) {
      return;
    }
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    setIsPreviewPanning(true);
    panPointerRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: previewPan.x,
      startPanY: previewPan.y,
    };
  }, [previewPan.x, previewPan.y]);

  const onPreviewViewportPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = panPointerRef.current;
    if (!drag || drag.pointerId !== e.pointerId) {
      return;
    }
    setPreviewPan({
      x: drag.startPanX + e.clientX - drag.startClientX,
      y: drag.startPanY + e.clientY - drag.startClientY,
    });
  }, []);

  const onPreviewViewportPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = panPointerRef.current;
    if (!drag || drag.pointerId !== e.pointerId) {
      return;
    }
    panPointerRef.current = null;
    setIsPreviewPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);

  previewZoomRef.current = previewZoom;

  return (
    <div data-editor-chrome className="ec-shell flex h-[100dvh] min-h-0 flex-col font-sans">
      <header className="ec-header flex h-12 shrink-0 items-center justify-between gap-4 px-3 pl-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin"
            className="ec-brand flex items-center gap-2 rounded-md px-1 py-1 transition-colors"
            aria-label="OpenFrame admin home"
          >
            <span className="ec-accent-dot h-2 w-2 shrink-0 rounded-full" aria-hidden />
            <span className="ec-title text-[15px] font-semibold tracking-tight">OpenFrame</span>
          </Link>
          {slug ? (
            <span className="ec-current-page hidden min-w-0 items-center gap-1.5 sm:inline-flex" aria-label="Current page">
              <span className="ec-text-faint text-[12px]">/</span>
              <span className="ec-current-page-slug truncate font-mono text-[12px]">{slug}</span>
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {status === "loading" ? (
            <span className="ec-text-muted text-[12px]">Loading…</span>
          ) : isDirty ? (
            <span className="ec-text-accent-muted hidden text-[12px] font-medium sm:inline">Unsaved</span>
          ) : (
            <span className="ec-text-faint hidden text-[12px] sm:inline">Saved</span>
          )}
          <a
            href={slug ? `/${encodeURIComponent(slug)}` : "/"}
            target="_blank"
            rel="noopener noreferrer"
            className="ec-btn-secondary rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
            aria-label="Open this page on the public site in a new tab"
          >
            View site
          </a>
          <Link
            href="/admin/settings"
            className="ec-nav-link rounded-md px-2.5 py-1.5 text-[13px] transition-colors"
          >
            Settings
          </Link>
          <button
            type="button"
            className="ec-btn-secondary rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed"
            disabled={!canUndo}
            title="Undo (Ctrl+Z or ⌘Z)"
            onClick={() => undo()}
          >
            Undo
          </button>
          <button
            type="button"
            className="ec-btn-secondary rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed"
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z, Ctrl+Y, or ⌘⇧Z)"
            onClick={() => redo()}
          >
            Redo
          </button>
          <button
            type="button"
            className="ec-btn-primary rounded-md px-3.5 py-1.5 text-[13px] font-medium shadow-sm transition-colors disabled:cursor-not-allowed"
            disabled={busy || !document || !isDirty}
            title="Save (Ctrl+S or ⌘S)"
            onClick={() => void savePage()}
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {lastError ? (
        <div className="ec-error-bar shrink-0 px-4 py-2 text-[13px]">{lastError}</div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="ec-aside-left flex w-[272px] shrink-0 flex-col">
          <div className="ec-left-panel-top shrink-0 px-3 pb-2 pt-3">
            <div className="ec-tab-segment flex p-1" role="tablist" aria-label="Sidebar panel">
              <button
                type="button"
                role="tab"
                aria-selected={leftTab === "pages"}
                onClick={() => setLeftTab("pages")}
                className={`ec-tab-segment-btn flex-1 rounded-md px-1.5 py-1.5 text-center text-[12px] font-medium transition-colors ${
                  leftTab === "pages" ? "ec-tab-segment-btn-active" : ""
                }`}
              >
                Pages
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={leftTab === "layers"}
                onClick={() => setLeftTab("layers")}
                className={`ec-tab-segment-btn flex-1 rounded-md px-1.5 py-1.5 text-center text-[12px] font-medium transition-colors ${
                  leftTab === "layers" ? "ec-tab-segment-btn-active" : ""
                }`}
              >
                Layers
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={leftTab === "assets"}
                onClick={() => setLeftTab("assets")}
                className={`ec-tab-segment-btn flex-1 rounded-md px-1.5 py-1.5 text-center text-[12px] font-medium transition-colors ${
                  leftTab === "assets" ? "ec-tab-segment-btn-active" : ""
                }`}
              >
                Assets
              </button>
            </div>

            <div className="ec-search-row mt-3">
              <IconSearch className="ec-search-row-icon h-[15px] w-[15px] shrink-0" />
              <input
                type="search"
                className="ec-search-input min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                placeholder={leftTab === "layers" ? "Search layers…" : "Search…"}
                value={leftSearch}
                onChange={(e) => setLeftSearch(e.target.value)}
                disabled={leftTab !== "layers"}
                aria-label={leftTab === "layers" ? "Search layers" : "Search (switch to Layers to filter)"}
              />
            </div>
          </div>

          <div className="ec-left-panel-divider shrink-0" />

          <div className="ec-left-panel-body min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {leftTab === "pages" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="ec-pages-heading text-[11px] font-semibold uppercase tracking-wider">Pages</span>
                  <button
                    type="button"
                    className="ec-icon-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-40"
                    data-ec-add-page
                    onClick={startAddPageRow}
                    disabled={busy}
                    aria-label="Add page"
                  >
                    <IconPlus className="h-4 w-4" />
                  </button>
                </div>
                {pageListError ? (
                  <p className="ec-text-muted text-[12px] leading-relaxed">{pageListError}</p>
                ) : null}
                {pageListLoading ? (
                  <p className="ec-text-muted text-[13px]">Loading pages…</p>
                ) : (
                  <>
                    {isAddingPageRow || displaySlugs.length > 0 ? (
                      <ul className="ec-page-list space-y-1.5" role="list">
                        {isAddingPageRow ? (
                          <li key="__new_page__">
                            <div className="ec-page-list-row-new ec-page-list-row-idle flex items-center gap-2 overflow-hidden rounded-lg px-2 py-1.5">
                              <IconFile className="ec-page-list-row-file h-4 w-4 shrink-0" />
                              <input
                                ref={newSlugInputRef}
                                autoFocus
                                className="ec-page-new-slug-input min-w-0 flex-1 font-mono text-[13px] outline-none disabled:opacity-40"
                                value={newSlugDraft}
                                onChange={(e) => {
                                  setNewSlugDraft(e.target.value);
                                  setNewSlugError(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    skipNewSlugBlurCommitRef.current = true;
                                    commitNewSlugFromInput((e.target as HTMLInputElement).value);
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    skipNewSlugBlurCommitRef.current = true;
                                    closeNewPageRow();
                                  }
                                }}
                                onBlur={(e) => {
                                  const rel = e.relatedTarget;
                                  if (rel instanceof HTMLElement && rel.closest("button[data-ec-add-page]")) {
                                    skipNewSlugBlurCommitRef.current = true;
                                    queueMicrotask(() => {
                                      skipNewSlugBlurCommitRef.current = false;
                                      setNewSlugDraft("");
                                      setNewSlugError(null);
                                      newSlugInputRef.current?.focus();
                                    });
                                    return;
                                  }
                                  queueMicrotask(() => {
                                    if (skipNewSlugBlurCommitRef.current) {
                                      skipNewSlugBlurCommitRef.current = false;
                                      return;
                                    }
                                    if (!isAddingPageRowRef.current) {
                                      return;
                                    }
                                    const el = newSlugInputRef.current;
                                    if (!el) {
                                      return;
                                    }
                                    commitNewSlugFromInput(el.value);
                                  });
                                }}
                                placeholder="page-name"
                                spellCheck={false}
                                disabled={busy}
                                aria-label="New page slug"
                              />
                            </div>
                            {newSlugError ? (
                              <p className="ec-new-slug-error mt-1 px-0.5 text-[11px] leading-snug">{newSlugError}</p>
                            ) : null}
                          </li>
                        ) : null}
                        {displaySlugs.map((s) => (
                          <li key={s}>
                            <PageListRow
                              slugEntry={s}
                              isActive={s === slug}
                              showDraftBadge={s === slug && isDirty}
                              busy={busy}
                              onSelect={() => {
                                void trySwitchPage(s);
                              }}
                              onOpenPreview={() => {
                                window.open(`/${encodeURIComponent(s)}`, "_blank", "noopener,noreferrer");
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {!pageListLoading && displaySlugs.length === 0 && !isAddingPageRow ? (
                      <p className="ec-text-muted text-[13px]">No pages yet. Use + to add one.</p>
                    ) : null}
                  </>
                )}
                <p className="ec-text-faint pt-1 text-[11px] leading-relaxed">
                  Use + to add a page. Save persists changes to SQLite.
                </p>
              </div>
            ) : null}

            {leftTab === "layers" ? (
              <div className="space-y-3">
                <div className="ec-layer-page-field">
                  <label htmlFor="ec-layer-page-select" className="ec-layer-page-label sr-only">
                    Active page
                  </label>
                  <div className="ec-layer-page-select-wrap relative">
                    <select
                      id="ec-layer-page-select"
                      className="ec-layer-page-select w-full cursor-pointer font-mono text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
                      value={slug ?? ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next) {
                          void trySwitchPage(next);
                        }
                      }}
                      disabled={busy || displaySlugs.length === 0}
                      aria-label="Switch page"
                    >
                      {displaySlugs.length === 0 ? (
                        <option value="">No pages</option>
                      ) : (
                        displaySlugs.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))
                      )}
                    </select>
                    <IconChevronDown className="ec-layer-page-select-chevron pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                  </div>
                </div>
                {!document ? (
                  <p className="ec-text-muted text-[13px]">No document loaded.</p>
                ) : !layersTreeRoot ? (
                  <p className="ec-text-muted text-[13px]">No matching layers.</p>
                ) : (
                  <div className="ec-tree-box" ref={treeBoxRef}>
                    <DndContext
                      sensors={treeDndSensors}
                      collisionDetection={pointerWithin}
                      onDragStart={treeDnd.onDragStart}
                      onDragOver={treeDnd.onDragOver}
                      onDragEnd={onLayerTreeDragEnd}
                      onDragCancel={treeDnd.onDragCancel}
                    >
                      {visibleTreeRows.map((row) => {
                        const rowNode = flatNodesById.get(row.nodeId);
                        if (!rowNode) {
                          return null;
                        }
                        let isSelectedBranch = false;
                        if (selectedNodeId && selectedNodeId !== row.nodeId) {
                          let cursor = parentIdByNodeId.get(row.nodeId) ?? null;
                          while (cursor) {
                            if (cursor === selectedNodeId) {
                              isSelectedBranch = true;
                              break;
                            }
                            cursor = parentIdByNodeId.get(cursor) ?? null;
                          }
                        }
                        return (
                          <TreeRowItem
                            key={row.nodeId}
                            row={row}
                            node={rowNode}
                            selectedId={selectedNodeId}
                            onSelect={(id) => selectNode(id)}
                            isSelectedBranch={isSelectedBranch}
                            collapsedIds={collapsedLayerIds}
                            onToggleCollapse={toggleLayerCollapse}
                            dragActiveId={treeDnd.dragActiveId}
                            dragOverSlot={treeDnd.dragOverSlot}
                            registerRowEl={registerRowEl}
                          />
                        );
                      })}
                      <TreeDropIndicator
                        containerRef={treeBoxRef}
                        rowEls={rowElsRef}
                        slot={treeDnd.dragOverSlot}
                        parentIdByNodeId={parentIdByNodeId}
                      />
                      <DragOverlay dropAnimation={null}>
                        {treeDnd.dragActiveId && flatNodesById.get(treeDnd.dragActiveId) ? (
                          <div className="ec-tree-drag-overlay rounded-md text-[13px]">
                            <TreeDragOverlayRow
                              node={flatNodesById.get(treeDnd.dragActiveId) as PageNode}
                            />
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  </div>
                )}
                {!treeDndEnabled ? (
                  <p className="ec-text-faint text-[11px] leading-relaxed">Drag & drop is disabled while layer search is active.</p>
                ) : null}
              </div>
            ) : null}

            {leftTab === "assets" ? (
              <div className="ec-library-card rounded-lg p-4">
                <p className="ec-library-title text-[13px] font-medium">Components & presets</p>
                <p className="ec-library-hint mt-2 text-[12px] leading-relaxed">
                  Layer presets (built-in and your saved subtrees). Choose where to insert relative to the selected layer.
                </p>
                <button
                  type="button"
                  className="ec-btn-primary mt-4 w-full rounded-md px-3 py-2 text-[13px] font-medium transition-colors"
                  onClick={() => setPresetPickerOpen(true)}
                >
                  Browse presets…
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="ec-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="ec-preview-workspace flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="ec-preview-chrome flex shrink-0 flex-col gap-1.5 px-3 py-2">
              <div className="ec-preview-chrome-row flex min-h-0 min-w-0 flex-nowrap items-center gap-2">
                <div className="ec-preview-bp-inline flex min-h-0 min-w-0 flex-1 flex-nowrap items-center gap-1">
                  <div className="ec-preview-bp-scroll flex min-h-0 min-w-0 flex-1 flex-nowrap items-center overflow-x-auto">
                    <div className="ec-preview-bp-segment inline-flex shrink-0 flex-nowrap items-center gap-1 rounded-lg p-1">
                      {bpInline.map((bp) => (
                        <PreviewBpPill
                          key={bp.id}
                          bp={bp}
                          isActive={previewBpId === bp.id}
                          onSelect={() => selectPreviewBreakpoint(bp.id)}
                          onRemoveCustom={
                            bp.builtIn ? undefined : () => removeCustomPreviewBreakpoint(bp.id)
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {bpOverflow.length > 0 ? (
                    <details className="ec-preview-bp-more relative shrink-0">
                      <summary
                        className="ec-preview-bp-more-trigger inline-flex list-none items-center justify-center"
                        aria-label={`More viewport sizes (${bpOverflow.length})`}
                      >
                        <IconChevronDown className="h-4 w-4" />
                      </summary>
                      <div className="ec-preview-bp-more-panel">
                        <div className="ec-preview-bp-more-inner flex flex-col gap-1.5 p-2">
                          {bpOverflow.map((bp) => (
                            <div key={bp.id} className="ec-preview-bp-more-row flex items-stretch justify-start">
                              <PreviewBpPill
                                bp={bp}
                                isActive={previewBpId === bp.id}
                                onSelect={() => selectPreviewBreakpoint(bp.id)}
                                closeParentDetails
                                onRemoveCustom={
                                  bp.builtIn ? undefined : () => removeCustomPreviewBreakpoint(bp.id)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
                <div className="ec-preview-zoom-tools flex shrink-0 flex-nowrap items-center gap-1.5">
                  <button
                    type="button"
                    className="ec-preview-zoom-btn"
                    aria-label="Zoom out"
                    onClick={() => setPreviewZoom((z) => Math.max(0.06, z / 1.12))}
                  >
                    −
                  </button>
                  <span className="ec-preview-zoom-readout tabular-nums">{Math.round(previewZoom * 100)}%</span>
                  <button
                    type="button"
                    className="ec-preview-zoom-btn"
                    aria-label="Zoom in"
                    onClick={() => setPreviewZoom((z) => Math.min(2.5, z * 1.12))}
                  >
                    +
                  </button>
                  <button type="button" className="ec-preview-fit-btn" onClick={applyPreviewFit} title="Fit width; center horizontally; keep vertical pan">
                    Fit
                  </button>
                </div>
                <details ref={previewAddDetailsRef} className="ec-preview-add-details relative shrink-0">
                  <summary className="ec-preview-add-summary inline-flex list-none items-center gap-1.5">
                    <IconPlus className="h-4 w-4 shrink-0" />
                    <span className="text-[12px] font-medium">Viewport</span>
                  </summary>
                  <div className="ec-preview-add-panel">
                    <form
                      className="ec-preview-add-form flex flex-col gap-2 p-2.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addCustomPreviewBreakpoint();
                      }}
                    >
                      <p className="ec-text-muted text-[11px] leading-snug">Add a canvas size (px). Stored in this browser.</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="ec-preview-add-field-label">Width</span>
                          <input
                            className="ec-input w-full min-w-0 rounded-md px-2 py-1.5 font-mono text-[12px]"
                            inputMode="numeric"
                            value={newBpWidth}
                            onChange={(e) => setNewBpWidth(e.target.value)}
                            aria-label="Width in pixels"
                          />
                        </label>
                        <span className="ec-text-muted pb-2 text-[12px]">×</span>
                        <label className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="ec-preview-add-field-label">Height</span>
                          <input
                            className="ec-input w-full min-w-0 rounded-md px-2 py-1.5 font-mono text-[12px]"
                            inputMode="numeric"
                            value={newBpHeight}
                            onChange={(e) => setNewBpHeight(e.target.value)}
                            aria-label="Height in pixels"
                          />
                        </label>
                      </div>
                      <button type="submit" className="ec-preview-add-submit w-full rounded-md py-1.5 text-[12px] font-medium">
                        Add viewport
                      </button>
                    </form>
                  </div>
                </details>
              </div>
              <p className="ec-preview-chrome-hint text-[10px] leading-snug">
                Space hand · two-finger pan · ⌃/⌘+scroll zoom · Fit = width + horizontal center
              </p>
            </div>

            <div
              ref={previewViewportRef}
              className={`ec-preview-viewport relative min-h-0 flex-1 overflow-hidden ${
                previewHandTool ? "ec-preview-viewport-hand" : ""
              } ${isPreviewPanning ? "ec-preview-viewport-panning" : ""}`}
              onPointerDown={onPreviewViewportPointerDown}
              onPointerMove={onPreviewViewportPointerMove}
              onPointerUp={onPreviewViewportPointerUp}
              onPointerCancel={onPreviewViewportPointerUp}
            >
              <div className="flex h-full min-h-[200px] w-full items-center justify-center">
                {document ? (
                  <div
                    /**
                     * `shrink-0` is essential: as a flex child, the wrap defaults to `flex-shrink: 1`,
                     * which silently squashed `width: 1920` to the editor canvas width on Desktop
                     * (e.g. 1100×1080 instead of 1920×1080). Tablet/Mobile only worked by accident
                     * because 834/390 fit inside the canvas without shrinking.
                     */
                    className="ec-preview-transform-wrap shrink-0 will-change-transform"
                    style={{
                      width: activePreviewBp.width,
                      height: previewCanvasHeight,
                      transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <iframe
                      ref={draftIframeRef}
                      title="OpenFrame draft preview"
                      className="ec-preview-frame-draft block h-full w-full rounded-md"
                      src="/admin/preview/frame?draft=1"
                      onLoad={pushDraftToIframe}
                    />
                  </div>
                ) : (
                  <div className="ec-preview-empty flex min-h-[200px] w-full max-w-md flex-col items-center justify-center rounded-lg px-4 text-center">
                    Load a page to preview.
                  </div>
                )}
              </div>
              {previewHandTool ? (
                <div
                  className="ec-preview-hand-overlay pointer-events-auto absolute inset-0 z-10"
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
        </main>

        <aside className="ec-aside-right flex w-[300px] shrink-0 flex-col">
          <div className="ec-props-head shrink-0 px-3 pb-2 pt-3">
            <h2 className="ec-props-title text-[13px] font-semibold tracking-tight">Properties</h2>
            {selectedNode && selectedNodeId ? (
              <div className="ec-props-head-meta mt-2 flex min-w-0 flex-col gap-2">
                <span className="ec-props-type-chip w-fit shrink-0">{selectedNode.type}</span>
                <label className="ec-props-layer-name flex min-w-0 flex-col gap-1">
                  <span className="ec-text-muted text-[11px]">Layer name</span>
                  <input
                    type="text"
                    className="ec-input ec-props-layer-name-input w-full min-w-0 rounded-md px-2.5 py-1.5 text-[13px]"
                    autoComplete="off"
                    maxLength={128}
                    value={selectedNode.name ?? ""}
                    placeholder={getLayerNamePlaceholder(selectedNode)}
                    onChange={(e) => updateNodeName(selectedNode.id, e.target.value)}
                  />
                </label>
                {selectedNode.id === document?.root.id ? (
                  <button
                    type="button"
                    className="ec-btn-secondary w-full rounded-md px-2.5 py-1.5 text-[12px] transition-colors"
                    title="Append pasted subtree under Page (⌘V)"
                    onClick={() => {
                      void navigator.clipboard
                        .readText()
                        .then((text) => {
                          pasteFromClipboardText(text);
                        })
                        .catch(() => {});
                    }}
                  >
                    Paste layer
                  </button>
                ) : null}
                {selectedNode.id !== document?.root.id ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="ec-btn-secondary w-full rounded-md px-2.5 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed"
                      title="Copy subtree (⌘C)"
                      onClick={() => {
                        const payload = getClipboardPayloadForSelectedNode();
                        if (payload) {
                          void navigator.clipboard.writeText(payload);
                        }
                      }}
                    >
                      Copy layer
                    </button>
                    <button
                      type="button"
                      className="ec-btn-secondary w-full rounded-md px-2.5 py-1.5 text-[12px] transition-colors"
                      title="Cut subtree — copy then remove (⌘X)"
                      onClick={() => {
                        const payload = getClipboardPayloadForSelectedNode();
                        if (!payload) {
                          return;
                        }
                        void navigator.clipboard
                          .writeText(payload)
                          .then(() => {
                            removeSelectedNode();
                          })
                          .catch(() => {});
                      }}
                    >
                      Cut layer
                    </button>
                    <button
                      type="button"
                      className="ec-btn-secondary w-full rounded-md px-2.5 py-1.5 text-[12px] transition-colors"
                      title="Paste after selection (⌘V)"
                      onClick={() => {
                        void navigator.clipboard
                          .readText()
                          .then((text) => {
                            pasteFromClipboardText(text);
                          })
                          .catch(() => {});
                      }}
                    >
                      Paste layer
                    </button>
                    <button type="button" className="ec-props-action-btn w-full text-[12px]" onClick={() => duplicateSelectedNode()}>
                      Duplicate layer
                    </button>
                    <button
                      type="button"
                      className="ec-btn-secondary w-full rounded-md px-2.5 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed"
                      onClick={() => moveSelectedNode("up")}
                      disabled={!canMoveSelectedNodeUp}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="ec-btn-secondary w-full rounded-md px-2.5 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed"
                      onClick={() => moveSelectedNode("down")}
                      disabled={!canMoveSelectedNodeDown}
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      className="ec-props-danger-btn col-span-2 w-full text-[12px]"
                      onClick={() => removeSelectedNode()}
                    >
                      Remove layer
                    </button>
                  </div>
                ) : null}
                <details className="ec-props-internal-id min-w-0 text-[11px]">
                  <summary className="ec-text-muted cursor-pointer select-none">Internal ID (for codegen)</summary>
                  <code className="ec-props-internal-id-code mt-1 block break-all font-mono text-[10px] leading-snug">
                    {selectedNodeId}
                  </code>
                </details>
              </div>
            ) : (
              <p className="ec-props-head-empty mt-1.5 text-[12px] leading-snug">No layer selected</p>
            )}
          </div>
          <div className="ec-left-panel-divider shrink-0" />
          <div className="ec-props-body min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <DocumentSettingsPanel />
            <PropsPanel />
          </div>
        </aside>
      </div>
      <PresetPickerModal open={presetPickerOpen} onClose={() => setPresetPickerOpen(false)} />
    </div>
  );
}
