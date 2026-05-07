import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parsePageDocument } from "@/lib/openframe";

import { BUILTIN_PRESETS } from "./builtin-presets";
import { useEditorStore } from "./editor-store";

const sampleDoc = {
  version: 1 as const,
  root: {
    id: "root",
    type: "container",
    props: {},
    children: [
      { id: "t1", type: "text", props: { text: "Hi" }, children: [] },
    ],
  },
};

beforeEach(() => {
  useEditorStore.getState().reset();
});

afterEach(() => {
  useEditorStore.getState().reset();
  vi.restoreAllMocks();
});

describe("useEditorStore", () => {
  it("loadPage uses starter document on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 404,
      json: async () => ({}),
    } as Response);

    await useEditorStore.getState().loadPage("missing");

    const s = useEditorStore.getState();
    expect(s.slug).toBe("missing");
    expect(s.document).not.toBeNull();
    expect(s.isDirty).toBe(true);
    expect(s.status).toBe("idle");
    expect(s.selectedNodeId).toBe(s.document?.root.id ?? null);
  });

  it("loadPage stores document on 200", async () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => JSON.parse(JSON.stringify(parsed.data)) as unknown,
    } as Response);

    await useEditorStore.getState().loadPage("home");

    const s = useEditorStore.getState();
    expect(s.document?.root.children[0]?.props.text).toBe("Hi");
    expect(s.isDirty).toBe(false);
    expect(s.status).toBe("idle");
  });

  it("updateNodeProps sets isDirty", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().updateNodeProps("t1", { text: "Changed" });

    expect(useEditorStore.getState().document?.root.children[0]?.props.text).toBe("Changed");
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it("updateNodeName trims, clamps length, and clears when empty", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().updateNodeName("t1", "  Hero  ");
    expect(useEditorStore.getState().document?.root.children[0]?.name).toBe("Hero");
    expect(useEditorStore.getState().isDirty).toBe(true);

    useEditorStore.getState().updateNodeName("t1", "   ");
    expect(useEditorStore.getState().document?.root.children[0]?.name).toBeUndefined();

    const long = `${"a".repeat(200)}`;
    useEditorStore.getState().updateNodeName("t1", long);
    expect(useEditorStore.getState().document?.root.children[0]?.name).toHaveLength(128);
  });

  it("savePage sends PUT and clears dirty on success", async () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: true,
      lastError: null,
      previewNonce: 0,
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => JSON.parse(JSON.stringify(parsed.data)) as unknown,
    } as Response);

    await useEditorStore.getState().savePage();

    const s = useEditorStore.getState();
    expect(s.isDirty).toBe(false);
    expect(s.status).toBe("idle");
    expect(s.previewNonce).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pages/home",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("addChildTo inserts frame under container", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "root",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().addChildTo("root", "frame");

    const s = useEditorStore.getState();
    expect(s.document?.root.children).toHaveLength(2);
    expect(s.document?.root.children[1]?.type).toBe("frame");
    expect(s.document?.root.children[1]?.props.layoutType).toBe("stack");
    expect(s.selectedNodeId).toBe(s.document?.root.children[1]?.id);
    expect(s.isDirty).toBe(true);
  });

  it("addChildTo can keep parent selected for batch insert", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "root",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().addChildTo("root", "text", { selectNew: false });
    useEditorStore.getState().addChildTo("root", "text", { selectNew: false });

    const s = useEditorStore.getState();
    expect(s.document?.root.children).toHaveLength(3);
    expect(s.selectedNodeId).toBe("root");
    expect(s.isDirty).toBe(true);
  });

  it("duplicateSelectedNode clones selected node with new id", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().duplicateSelectedNode();

    const s = useEditorStore.getState();
    expect(s.document?.root.children).toHaveLength(2);
    expect(s.document?.root.children[0]?.id).toBe("t1");
    expect(s.document?.root.children[1]?.id).not.toBe("t1");
    expect(s.document?.root.children[1]?.type).toBe("text");
    expect(s.document?.root.children[1]?.props.text).toBe("Hi");
    expect(s.selectedNodeId).toBe(s.document?.root.children[1]?.id);
    expect(s.isDirty).toBe(true);
  });

  it("duplicateSelectedNode ignores root selection", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "root",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().duplicateSelectedNode();

    const s = useEditorStore.getState();
    expect(s.document?.root.children).toHaveLength(1);
    expect(s.selectedNodeId).toBe("root");
    expect(s.isDirty).toBe(false);
  });

  it("getClipboardPayloadForSelectedNode encodes selected subtree", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    const payload = useEditorStore.getState().getClipboardPayloadForSelectedNode();
    expect(payload).toContain("openframe:layer:v1");
    expect(payload).toContain('"type":"text"');
  });

  it("pasteFromClipboardText inserts after selected node", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    const payload = useEditorStore.getState().getClipboardPayloadForSelectedNode();
    expect(payload).not.toBeNull();

    const ok = useEditorStore.getState().pasteFromClipboardText(payload ?? "");
    expect(ok).toBe(true);

    const s = useEditorStore.getState();
    expect(s.document?.root.children).toHaveLength(2);
    expect(s.document?.root.children[0]?.id).toBe("t1");
    expect(s.document?.root.children[1]?.type).toBe("text");
    expect(s.document?.root.children[1]?.props.text).toBe("Hi");
    expect(s.document?.root.children[1]?.id).not.toBe("t1");
    expect(s.selectedNodeId).toBe(s.document?.root.children[1]?.id);
    expect(s.isDirty).toBe(true);
  });

  it("pasteFromClipboardText appends under root when root is selected", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    const payload = useEditorStore.getState().getClipboardPayloadForSelectedNode();
    expect(payload).not.toBeNull();

    useEditorStore.setState({ selectedNodeId: "root" });
    const ok = useEditorStore.getState().pasteFromClipboardText(payload ?? "");
    expect(ok).toBe(true);

    const s = useEditorStore.getState();
    expect(s.document?.root.children).toHaveLength(2);
    expect(s.selectedNodeId).not.toBe("t1");
  });

  it("applyPresetSubtree inserts built-in preset after selection", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    const hero = BUILTIN_PRESETS.find((p) => p.id === "builtin-hero");
    expect(hero).toBeDefined();
    const ok = useEditorStore.getState().applyPresetSubtree(hero!.root, "after");
    expect(ok).toBe(true);

    const s = useEditorStore.getState();
    expect(s.document?.root.children).toHaveLength(2);
    expect(s.document?.root.children[1]?.type).toBe("section");
    expect(s.selectedNodeId).toBe(s.document?.root.children[1]?.id);
    expect(s.isDirty).toBe(true);
  });

  it("pasteFromClipboardText rejects garbage", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "t1",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    expect(useEditorStore.getState().pasteFromClipboardText("not-openframe")).toBe(false);
    expect(useEditorStore.getState().document?.root.children).toHaveLength(1);
  });

  it("undo and redo restore latest structural change", () => {
    const parsed = parsePageDocument(sampleDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "root",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().addChildTo("root", "frame");
    expect(useEditorStore.getState().document?.root.children).toHaveLength(2);
    expect(useEditorStore.getState().canUndo()).toBe(true);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document?.root.children).toHaveLength(1);
    expect(useEditorStore.getState().canRedo()).toBe(true);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document?.root.children).toHaveLength(2);
  });

  it("moveSelectedNode reorders siblings and respects boundaries", () => {
    const doc = {
      version: 1 as const,
      root: {
        id: "root",
        type: "container" as const,
        props: {},
        children: [
          { id: "a", type: "text" as const, props: { text: "A" }, children: [] },
          { id: "b", type: "text" as const, props: { text: "B" }, children: [] },
          { id: "c", type: "text" as const, props: { text: "C" }, children: [] },
        ],
      },
    };
    const parsed = parsePageDocument(doc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "b",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    expect(useEditorStore.getState().canMoveSelectedNode("up")).toBe(true);
    expect(useEditorStore.getState().canMoveSelectedNode("down")).toBe(true);

    useEditorStore.getState().moveSelectedNode("up");
    expect(useEditorStore.getState().document?.root.children.map((n) => n.id)).toEqual(["b", "a", "c"]);

    useEditorStore.getState().moveSelectedNode("up");
    expect(useEditorStore.getState().document?.root.children.map((n) => n.id)).toEqual(["b", "a", "c"]);
    expect(useEditorStore.getState().canMoveSelectedNode("up")).toBe(false);
  });

  it("reorderNodesByIds can move between parents when allowed", () => {
    const doc = {
      version: 1 as const,
      root: {
        id: "root",
        type: "container" as const,
        props: {},
        children: [
          { id: "a", type: "text" as const, props: { text: "A" }, children: [] },
          { id: "b", type: "text" as const, props: { text: "B" }, children: [] },
          {
            id: "group",
            type: "frame" as const,
            props: {},
            children: [{ id: "c", type: "text" as const, props: { text: "C" }, children: [] }],
          },
        ],
      },
    };
    const parsed = parsePageDocument(doc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "b",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().reorderNodesByIds("a", "b");
    expect(useEditorStore.getState().document?.root.children.map((n) => n.id)).toEqual(["b", "a", "group"]);

    useEditorStore.getState().reorderNodesByIds("c", "a");
    expect(useEditorStore.getState().document?.root.children.map((n) => n.id)).toEqual(["b", "a", "c", "group"]);
  });

  it("reorderNodesByIds blocks section under non-root parent", () => {
    const doc = {
      version: 1 as const,
      root: {
        id: "root",
        type: "container" as const,
        props: {},
        children: [
          { id: "sec", type: "section" as const, props: {}, children: [] },
          {
            id: "group",
            type: "frame" as const,
            props: {},
            children: [{ id: "leaf", type: "text" as const, props: { text: "x" }, children: [] }],
          },
        ],
      },
    };
    const parsed = parsePageDocument(doc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    useEditorStore.setState({
      document: parsed.data,
      slug: "home",
      selectedNodeId: "sec",
      status: "idle",
      isDirty: false,
      lastError: null,
    });

    useEditorStore.getState().reorderNodesByIds("sec", "leaf");
    expect(useEditorStore.getState().document?.root.children.map((n) => n.id)).toEqual(["sec", "group"]);
  });
});
