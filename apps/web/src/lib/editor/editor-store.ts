import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ZodError } from "zod";

import {
  pageNodeSchema,
  parsePageDocument,
  type OpenframePageDocument,
  type PageMeta,
  type PageNode,
  type PageTheme,
} from "@/lib/openframe";

import { defaultButtonPropsRecord } from "@/lib/preview/button-block";
import { defaultCardPropsRecord } from "@/lib/preview/card-block";
import { defaultFaqPropsRecord } from "@/lib/preview/faq-block";
import { defaultFramePropsRecord } from "@/lib/preview/frame-block";
import { defaultHeadingPropsRecord } from "@/lib/preview/heading-block";
import { defaultImagePropsRecord } from "@/lib/preview/image-block";
import { defaultLinkPropsRecord } from "@/lib/preview/link-block";
import { defaultLogoCloudPropsRecord } from "@/lib/preview/logo-cloud-block";
import { defaultNavHeaderPropsRecord } from "@/lib/preview/nav-header-block";
import { defaultSectionPropsRecord } from "@/lib/preview/section-block";
import { defaultSplitPropsRecord } from "@/lib/preview/split-block";
import { defaultTestimonialPropsRecord } from "@/lib/preview/testimonial-block";
import { defaultTextPropsRecord } from "@/lib/preview/text-block";

import { decodeLayerClipboard, encodeLayerClipboard } from "./layer-clipboard";
import { cloneSubtreeWithFreshIds, createEditorNodeId } from "./node-clone";
import type { PresetApplyMode } from "./preset-types";
import { getStarterPageDocument } from "./starter-document";
import { addUserPreset, deleteUserPreset as deleteStoredUserPreset } from "./user-presets-storage";
import {
  canMoveNodeById,
  findNodeById,
  findParentAndIndex,
  moveNodeById,
  moveNodeByIds,
  removeNodeById,
  type ReorderPlacement,
  type MoveDirection,
} from "./tree";
import { canParentAcceptChild } from "./tree-rules";

export type EditorStatus = "idle" | "loading" | "saving" | "error";

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function formatApiIssues(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "issues" in payload &&
    Array.isArray((payload as { issues: unknown }).issues)
  ) {
    const issues = (payload as { issues: { path?: string[]; message?: string }[] }).issues;
    return issues
      .map((i) => `${(i.path ?? []).join(".") || "(root)"}: ${i.message ?? "invalid"}`)
      .join("\n");
  }
  if (payload && typeof payload === "object" && "error" in payload) {
    return String((payload as { error: unknown }).error);
  }
  return "Request failed";
}

export type EditorState = {
  slug: string | null;
  document: OpenframePageDocument | null;
  selectedNodeId: string | null;
  status: EditorStatus;
  lastError: string | null;
  isDirty: boolean;
  previewNonce: number;
  historyPast: EditorHistorySnapshot[];
  historyFuture: EditorHistorySnapshot[];
};

type EditorHistorySnapshot = {
  document: OpenframePageDocument | null;
  selectedNodeId: string | null;
  isDirty: boolean;
};

export type EditorChildKind =
  | "text"
  | "frame"
  | "heading"
  | "link"
  | "button"
  | "image"
  | "section"
  | "split"
  | "card"
  | "faq"
  | "testimonial"
  | "logo-cloud"
  | "nav-header";

type AddChildOptions = {
  /** When false, keep parent selected to support fast multi-add flows. */
  selectNew?: boolean;
};

type EditorActions = {
  setSlug: (slug: string) => void;
  selectNode: (id: string | null) => void;
  /** Sets optional `PageNode.name` (trimmed, max 128). Empty string clears `name`. */
  updateNodeName: (nodeId: string, name: string) => void;
  updateNodeProps: (nodeId: string, patch: Record<string, unknown>) => void;
  /** Merge or clear top-level `theme` / `meta` on the page document (Phase 3). */
  patchPageDocument: (patch: { theme?: Partial<PageTheme> | null; meta?: Partial<PageMeta> | null }) => void;
  removeSelectedNode: () => void;
  /** Duplicate currently selected non-root node (deep clone with fresh IDs) and select the clone. */
  duplicateSelectedNode: () => void;
  /** Serialized OpenFrame layer clipboard (`openframe:layer:v1` + JSON), or null if nothing to copy. */
  getClipboardPayloadForSelectedNode: () => string | null;
  /** Paste a subtree from clipboard text (see `decodeLayerClipboard`) after selection, or append under root if root is selected. */
  pasteFromClipboardText: (text: string) => boolean;
  /** Insert or replace relative to selection using a validated template subtree (fresh IDs). */
  applyPresetSubtree: (templateRoot: PageNode, mode: PresetApplyMode) => boolean;
  /** Save current selection as a user preset (localStorage). */
  saveUserPresetFromSelection: (name: string, description?: string) => { ok: boolean; error?: string };
  /** Remove a user preset by id. */
  deleteUserPresetById: (id: string) => void;
  reorderNodesByIds: (activeId: string, overId: string, placement?: ReorderPlacement) => void;
  moveSelectedNode: (direction: MoveDirection) => void;
  canMoveSelectedNode: (direction: MoveDirection) => boolean;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Insert a child under a layout-capable parent (`container`, `frame`, `section`, `split`, `card`). */
  addChildTo: (parentId: string, kind: EditorChildKind, options?: AddChildOptions) => void;
  /** @deprecated Use {@link addChildTo} with `"text"`. */
  addTextChildTo: (parentId: string) => void;
  loadPage: (slug: string) => Promise<void>;
  savePage: () => Promise<void>;
  bumpPreview: () => void;
  reset: () => void;
};

const initialState: EditorState = {
  slug: null,
  document: null,
  selectedNodeId: null,
  status: "idle",
  lastError: null,
  isDirty: false,
  previewNonce: 0,
  historyPast: [],
  historyFuture: [],
};

export type EditorStore = EditorState & EditorActions;

function cloneDocumentPlain(doc: OpenframePageDocument | null): OpenframePageDocument | null {
  if (!doc) {
    return null;
  }
  return JSON.parse(JSON.stringify(doc)) as OpenframePageDocument;
}

const HISTORY_LIMIT = 100;

function captureHistorySnapshot(state: Pick<EditorState, "document" | "selectedNodeId" | "isDirty">): EditorHistorySnapshot {
  return {
    document: cloneDocumentPlain(state.document),
    selectedNodeId: state.selectedNodeId,
    isDirty: state.isDirty,
  };
}

function pushHistoryBeforeChange(draft: EditorState, before: EditorHistorySnapshot) {
  draft.historyPast.push(before);
  if (draft.historyPast.length > HISTORY_LIMIT) {
    draft.historyPast.splice(0, draft.historyPast.length - HISTORY_LIMIT);
  }
  draft.historyFuture = [];
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    ...initialState,

    setSlug: (slug) =>
      set((draft) => {
        draft.slug = slug.trim() || null;
      }),

    selectNode: (id) =>
      set((draft) => {
        draft.selectedNodeId = id;
      }),

    updateNodeName: (nodeId, name) =>
      set((draft) => {
        if (!draft.document) {
          return;
        }
        const before = captureHistorySnapshot(get());
        const trimmed = name.trim().slice(0, 128);
        let changed = false;
        function walk(node: PageNode): boolean {
          if (node.id === nodeId) {
            if (trimmed === "") {
              if (node.name !== undefined) {
                delete node.name;
                changed = true;
              }
            } else {
              if (node.name !== trimmed) {
                node.name = trimmed;
                changed = true;
              }
            }
            return true;
          }
          for (const child of node.children) {
            if (walk(child)) {
              return true;
            }
          }
          return false;
        }
        if (walk(draft.document.root) && changed) {
          pushHistoryBeforeChange(draft, before);
          draft.isDirty = true;
        }
      }),

    updateNodeProps: (nodeId, patch) =>
      set((draft) => {
        if (!draft.document) {
          return;
        }
        const before = captureHistorySnapshot(get());
        let changed = false;
        function walk(node: PageNode): boolean {
          if (node.id === nodeId) {
            for (const [k, v] of Object.entries(patch)) {
              if (!Object.is((node.props as Record<string, unknown>)[k], v)) {
                (node.props as Record<string, unknown>)[k] = v;
                changed = true;
              }
            }
            return true;
          }
          for (const child of node.children) {
            if (walk(child)) {
              return true;
            }
          }
          return false;
        }
        if (walk(draft.document.root) && changed) {
          pushHistoryBeforeChange(draft, before);
          draft.isDirty = true;
        }
      }),

    patchPageDocument: (patch) =>
      set((draft) => {
        if (!draft.document) {
          return;
        }
        const before = captureHistorySnapshot(get());
        let changed = false;
        if (patch.theme !== undefined) {
          if (patch.theme === null) {
            if (draft.document.theme !== undefined) {
              delete draft.document.theme;
              changed = true;
            }
          } else {
            const nextTheme = { ...(draft.document.theme ?? {}), ...patch.theme };
            if (JSON.stringify(nextTheme) !== JSON.stringify(draft.document.theme ?? {})) {
              draft.document.theme = nextTheme;
              changed = true;
            }
          }
        }
        if (patch.meta !== undefined) {
          if (patch.meta === null) {
            if (draft.document.meta !== undefined) {
              delete draft.document.meta;
              changed = true;
            }
          } else {
            const nextMeta = { ...(draft.document.meta ?? {}), ...patch.meta };
            if (JSON.stringify(nextMeta) !== JSON.stringify(draft.document.meta ?? {})) {
              draft.document.meta = nextMeta;
              changed = true;
            }
          }
        }
        if (changed) {
          pushHistoryBeforeChange(draft, before);
          draft.isDirty = true;
        }
      }),

    removeSelectedNode: () =>
      set((draft) => {
        const id = draft.selectedNodeId;
        if (!draft.document || !id) {
          return;
        }
        if (id === draft.document.root.id) {
          return;
        }
        const before = captureHistorySnapshot(get());
        if (removeNodeById(draft.document.root, id)) {
          pushHistoryBeforeChange(draft, before);
          draft.selectedNodeId = draft.document.root.id;
          draft.isDirty = true;
        }
      }),

    duplicateSelectedNode: () =>
      set((draft) => {
        const id = draft.selectedNodeId;
        if (!draft.document || !id || id === draft.document.root.id) {
          return;
        }
        const before = captureHistorySnapshot(get());
        function walk(parent: PageNode): boolean {
          const idx = parent.children.findIndex((child) => child.id === id);
          if (idx >= 0) {
            const duplicated = cloneSubtreeWithFreshIds(parent.children[idx]);
            parent.children.splice(idx + 1, 0, duplicated);
            pushHistoryBeforeChange(draft, before);
            draft.selectedNodeId = duplicated.id;
            draft.isDirty = true;
            return true;
          }
          for (const child of parent.children) {
            if (walk(child)) {
              return true;
            }
          }
          return false;
        }
        walk(draft.document.root);
      }),

    getClipboardPayloadForSelectedNode: () => {
      const { document, selectedNodeId } = get();
      if (!document || !selectedNodeId || selectedNodeId === document.root.id) {
        return null;
      }
      const node = findNodeById(document.root, selectedNodeId);
      if (!node) {
        return null;
      }
      const plain = JSON.parse(JSON.stringify(node)) as PageNode;
      return encodeLayerClipboard(plain);
    },

    pasteFromClipboardText: (text) => {
      const decoded = decodeLayerClipboard(text);
      if (!decoded) {
        return false;
      }
      const parsed = pageNodeSchema.safeParse(decoded);
      if (!parsed.success) {
        return false;
      }

      let inserted = false;
      set((draft) => {
        if (!draft.document) {
          return;
        }
        const fresh = cloneSubtreeWithFreshIds(parsed.data);
        const selId = draft.selectedNodeId;

        if (selId === draft.document.root.id) {
          if (!canParentAcceptChild(draft.document.root, fresh)) {
            return;
          }
          const before = captureHistorySnapshot(get());
          draft.document.root.children.push(fresh);
          pushHistoryBeforeChange(draft, before);
          draft.selectedNodeId = fresh.id;
          draft.isDirty = true;
          inserted = true;
          return;
        }

        if (!selId) {
          return;
        }

        function walk(parent: PageNode): boolean {
          const idx = parent.children.findIndex((c) => c.id === selId);
          if (idx >= 0) {
            if (!canParentAcceptChild(parent, fresh)) {
              return false;
            }
            const before = captureHistorySnapshot(get());
            parent.children.splice(idx + 1, 0, fresh);
            pushHistoryBeforeChange(draft, before);
            draft.selectedNodeId = fresh.id;
            draft.isDirty = true;
            return true;
          }
          for (const child of parent.children) {
            if (walk(child)) {
              return true;
            }
          }
          return false;
        }

        inserted = walk(draft.document.root);
      });

      return inserted;
    },

    applyPresetSubtree: (templateRoot, mode) => {
      const validated = pageNodeSchema.safeParse(templateRoot);
      if (!validated.success) {
        return false;
      }
      const fresh = cloneSubtreeWithFreshIds(validated.data);

      let applied = false;
      set((draft) => {
        if (!draft.document || draft.selectedNodeId === null) {
          return;
        }
        const sel = draft.selectedNodeId;

        if (sel === draft.document.root.id) {
          if (mode === "replace") {
            return;
          }
          if (!canParentAcceptChild(draft.document.root, fresh)) {
            return;
          }
          const before = captureHistorySnapshot(get());
          if (mode === "before") {
            draft.document.root.children.unshift(fresh);
          } else {
            draft.document.root.children.push(fresh);
          }
          draft.selectedNodeId = fresh.id;
          draft.isDirty = true;
          pushHistoryBeforeChange(draft, before);
          applied = true;
          return;
        }

        const found = findParentAndIndex(draft.document.root, sel);
        if (!found) {
          return;
        }
        const { parent, index } = found;
        if (!canParentAcceptChild(parent, fresh)) {
          return;
        }

        const before = captureHistorySnapshot(get());
        if (mode === "replace") {
          parent.children.splice(index, 1, fresh);
        } else if (mode === "before") {
          parent.children.splice(index, 0, fresh);
        } else {
          parent.children.splice(index + 1, 0, fresh);
        }
        draft.selectedNodeId = fresh.id;
        draft.isDirty = true;
        pushHistoryBeforeChange(draft, before);
        applied = true;
      });

      return applied;
    },

    saveUserPresetFromSelection: (name, description) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return { ok: false, error: "Name is required" };
      }
      const { document, selectedNodeId } = get();
      if (!document || !selectedNodeId || selectedNodeId === document.root.id) {
        return { ok: false, error: "Select a layer other than Page" };
      }
      const node = findNodeById(document.root, selectedNodeId);
      if (!node) {
        return { ok: false, error: "Layer not found" };
      }
      const plain = JSON.parse(JSON.stringify(node)) as PageNode;
      const parsed = pageNodeSchema.safeParse(plain);
      if (!parsed.success) {
        return { ok: false, error: "Invalid layer data" };
      }
      addUserPreset({
        name: trimmed,
        description: description?.trim() ? description.trim().slice(0, 500) : undefined,
        root: parsed.data,
      });
      return { ok: true };
    },

    deleteUserPresetById: (id) => {
      deleteStoredUserPreset(id);
    },

    reorderNodesByIds: (activeId, overId, placement = "after") =>
      set((draft) => {
        if (!draft.document || !activeId || !overId || activeId === overId) {
          return;
        }
        const before = captureHistorySnapshot(get());
        if (moveNodeByIds(draft.document.root, activeId, overId, placement, canParentAcceptChild)) {
          pushHistoryBeforeChange(draft, before);
          draft.selectedNodeId = activeId;
          draft.isDirty = true;
        }
      }),

    moveSelectedNode: (direction) =>
      set((draft) => {
        const id = draft.selectedNodeId;
        if (!draft.document || !id || id === draft.document.root.id) {
          return;
        }
        const before = captureHistorySnapshot(get());
        if (moveNodeById(draft.document.root, id, direction)) {
          pushHistoryBeforeChange(draft, before);
          draft.isDirty = true;
        }
      }),

    canMoveSelectedNode: (direction) => {
      const { document, selectedNodeId } = get();
      if (!document || !selectedNodeId || selectedNodeId === document.root.id) {
        return false;
      }
      return canMoveNodeById(document.root, selectedNodeId, direction);
    },

    undo: () =>
      set((draft) => {
        const previous = draft.historyPast.pop();
        if (!previous) {
          return;
        }
        draft.historyFuture.push(
          captureHistorySnapshot({
            document: draft.document,
            selectedNodeId: draft.selectedNodeId,
            isDirty: draft.isDirty,
          }),
        );
        draft.document = cloneDocumentPlain(previous.document);
        draft.selectedNodeId = previous.selectedNodeId;
        draft.isDirty = previous.isDirty;
      }),

    redo: () =>
      set((draft) => {
        const next = draft.historyFuture.pop();
        if (!next) {
          return;
        }
        draft.historyPast.push(
          captureHistorySnapshot({
            document: draft.document,
            selectedNodeId: draft.selectedNodeId,
            isDirty: draft.isDirty,
          }),
        );
        draft.document = cloneDocumentPlain(next.document);
        draft.selectedNodeId = next.selectedNodeId;
        draft.isDirty = next.isDirty;
      }),

    canUndo: () => get().historyPast.length > 0,
    canRedo: () => get().historyFuture.length > 0,

    addChildTo: (parentId, kind, options) =>
      set((draft) => {
        if (!draft.document) {
          return;
        }
        const before = captureHistorySnapshot(get());
        const parent = findNodeById(draft.document.root, parentId);
        if (
          !parent ||
          (parent.type !== "container" &&
            parent.type !== "frame" &&
            parent.type !== "section" &&
            parent.type !== "split" &&
            parent.type !== "card")
        ) {
          return;
        }
        const id = createEditorNodeId(kind);

        let newNode: PageNode;
        switch (kind) {
          case "text":
            newNode = { id, type: "text", props: defaultTextPropsRecord(), children: [] };
            break;
          case "heading":
            newNode = { id, type: "heading", props: defaultHeadingPropsRecord(), children: [] };
            break;
          case "link":
            newNode = { id, type: "link", props: defaultLinkPropsRecord(), children: [] };
            break;
          case "button":
            newNode = { id, type: "button", props: defaultButtonPropsRecord(), children: [] };
            break;
          case "image":
            newNode = { id, type: "image", props: defaultImagePropsRecord(), children: [] };
            break;
          case "frame":
            newNode = { id, type: "frame", props: defaultFramePropsRecord(), children: [] };
            break;
          case "section":
            newNode = { id, type: "section", props: defaultSectionPropsRecord(), children: [] };
            break;
          case "split":
            newNode = { id, type: "split", props: defaultSplitPropsRecord(), children: [] };
            break;
          case "card":
            newNode = { id, type: "card", props: defaultCardPropsRecord(), children: [] };
            break;
          case "faq":
            newNode = { id, type: "faq", props: defaultFaqPropsRecord(), children: [] };
            break;
          case "testimonial":
            newNode = { id, type: "testimonial", props: defaultTestimonialPropsRecord(), children: [] };
            break;
          case "logo-cloud":
            newNode = { id, type: "logo-cloud", props: defaultLogoCloudPropsRecord(), children: [] };
            break;
          case "nav-header":
            newNode = { id, type: "nav-header", props: defaultNavHeaderPropsRecord(), children: [] };
            break;
          default: {
            const _never: never = kind;
            throw new Error(`Unsupported child kind: ${_never}`);
          }
        }

        parent.children.push(newNode);
        pushHistoryBeforeChange(draft, before);
        draft.selectedNodeId = options?.selectNew === false ? parentId : id;
        draft.isDirty = true;
      }),

    addTextChildTo: (parentId) => {
      get().addChildTo(parentId, "text");
    },

    loadPage: async (slug) => {
      const trimmed = slug.trim();
      if (!trimmed) {
        set((draft) => {
          draft.lastError = "Slug is empty";
          draft.status = "error";
        });
        return;
      }

      set((draft) => {
        draft.status = "loading";
        draft.lastError = null;
      });

      try {
        const res = await fetch(`/api/pages/${encodeURIComponent(trimmed)}`);

        if (res.status === 404) {
          const starter = structuredClone(getStarterPageDocument());
          set((draft) => {
            draft.document = starter;
            draft.slug = trimmed;
            draft.selectedNodeId = starter.root.id;
            draft.status = "idle";
            draft.isDirty = true;
            draft.lastError = null;
            draft.historyPast = [];
            draft.historyFuture = [];
          });
          return;
        }

        const body: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            res.status === 422 && body && typeof body === "object" && "issues" in body
              ? formatApiIssues(body)
              : formatApiIssues(body ?? { error: `HTTP ${res.status}` });
          set((draft) => {
            draft.status = "error";
            draft.lastError = msg;
            draft.document = null;
          });
          return;
        }

        const parsed = parsePageDocument(body);
        if (!parsed.ok) {
          set((draft) => {
            draft.status = "error";
            draft.lastError = formatZodError(parsed.error);
            draft.document = null;
          });
          return;
        }

        set((draft) => {
          // Deep clone so Immer owns a plain tree (Zod objects can confuse nested drafts).
          draft.document = structuredClone(parsed.data);
          draft.slug = trimmed;
          draft.selectedNodeId = parsed.data.root.id;
          draft.status = "idle";
          draft.isDirty = false;
          draft.lastError = null;
          draft.historyPast = [];
          draft.historyFuture = [];
        });
      } catch (e) {
        set((draft) => {
          draft.status = "error";
          draft.lastError = e instanceof Error ? e.message : String(e);
          draft.document = null;
        });
      }
    },

    savePage: async () => {
      const { slug, document } = get();
      if (!slug || !document) {
        set((draft) => {
          draft.lastError = "Nothing to save (load a page first)";
          draft.status = "error";
        });
        return;
      }

      const validated = parsePageDocument(document);
      if (!validated.ok) {
        set((draft) => {
          draft.lastError = formatZodError(validated.error);
          draft.status = "error";
        });
        return;
      }

      set((draft) => {
        draft.status = "saving";
        draft.lastError = null;
      });

      try {
        const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated.data),
        });

        const body: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = formatApiIssues(body ?? { error: `HTTP ${res.status}` });
          set((draft) => {
            draft.status = "error";
            draft.lastError = msg;
          });
          return;
        }

        const parsed = parsePageDocument(body);
        if (!parsed.ok) {
          set((draft) => {
            draft.status = "error";
            draft.lastError = formatZodError(parsed.error);
          });
          return;
        }

        set((draft) => {
          draft.document = structuredClone(parsed.data);
          draft.status = "idle";
          draft.isDirty = false;
          draft.lastError = null;
          draft.previewNonce += 1;
        });
      } catch (e) {
        set((draft) => {
          draft.status = "error";
          draft.lastError = e instanceof Error ? e.message : String(e);
        });
      }
    },

    bumpPreview: () =>
      set((draft) => {
        draft.previewNonce += 1;
      }),

    reset: () => set(initialState),
  })),
);
