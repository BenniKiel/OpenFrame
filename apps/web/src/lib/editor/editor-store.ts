import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ZodError } from "zod";

import {
  parsePageDocument,
  type OpenframePageDocument,
  type PageMeta,
  type PageNode,
  type PageTheme,
} from "@/lib/openframe";

import { defaultButtonPropsRecord } from "@/lib/preview/button-block";
import { defaultCardPropsRecord } from "@/lib/preview/card-block";
import { defaultFramePropsRecord } from "@/lib/preview/frame-block";
import { defaultHeadingPropsRecord } from "@/lib/preview/heading-block";
import { defaultImagePropsRecord } from "@/lib/preview/image-block";
import { defaultLinkPropsRecord } from "@/lib/preview/link-block";
import { defaultSectionPropsRecord } from "@/lib/preview/section-block";
import { defaultSplitPropsRecord } from "@/lib/preview/split-block";
import { defaultTextPropsRecord } from "@/lib/preview/text-block";

import { getStarterPageDocument } from "./starter-document";
import { findNodeById, removeNodeById } from "./tree";

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
  | "card";

type EditorActions = {
  setSlug: (slug: string) => void;
  selectNode: (id: string | null) => void;
  /** Sets optional `PageNode.name` (trimmed, max 128). Empty string clears `name`. */
  updateNodeName: (nodeId: string, name: string) => void;
  updateNodeProps: (nodeId: string, patch: Record<string, unknown>) => void;
  /** Merge or clear top-level `theme` / `meta` on the page document (Phase 3). */
  patchPageDocument: (patch: { theme?: Partial<PageTheme> | null; meta?: Partial<PageMeta> | null }) => void;
  removeSelectedNode: () => void;
  /** Insert a child under a layout-capable parent (`container`, `frame`, `section`, `split`, `card`). */
  addChildTo: (parentId: string, kind: EditorChildKind) => void;
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
};

export type EditorStore = EditorState & EditorActions;

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
        const trimmed = name.trim().slice(0, 128);
        function walk(node: PageNode): boolean {
          if (node.id === nodeId) {
            if (trimmed === "") {
              delete node.name;
            } else {
              node.name = trimmed;
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
        if (walk(draft.document.root)) {
          draft.isDirty = true;
        }
      }),

    updateNodeProps: (nodeId, patch) =>
      set((draft) => {
        if (!draft.document) {
          return;
        }
        function walk(node: PageNode): boolean {
          if (node.id === nodeId) {
            Object.assign(node.props, patch);
            return true;
          }
          for (const child of node.children) {
            if (walk(child)) {
              return true;
            }
          }
          return false;
        }
        walk(draft.document.root);
        draft.isDirty = true;
      }),

    patchPageDocument: (patch) =>
      set((draft) => {
        if (!draft.document) {
          return;
        }
        if (patch.theme !== undefined) {
          if (patch.theme === null) {
            delete draft.document.theme;
          } else {
            draft.document.theme = { ...(draft.document.theme ?? {}), ...patch.theme };
          }
        }
        if (patch.meta !== undefined) {
          if (patch.meta === null) {
            delete draft.document.meta;
          } else {
            draft.document.meta = { ...(draft.document.meta ?? {}), ...patch.meta };
          }
        }
        draft.isDirty = true;
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
        if (removeNodeById(draft.document.root, id)) {
          draft.selectedNodeId = draft.document.root.id;
          draft.isDirty = true;
        }
      }),

    addChildTo: (parentId, kind) =>
      set((draft) => {
        if (!draft.document) {
          return;
        }
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
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${kind}-${Date.now()}`;

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
          default: {
            const _never: never = kind;
            throw new Error(`Unsupported child kind: ${_never}`);
          }
        }

        parent.children.push(newNode);
        draft.selectedNodeId = id;
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
