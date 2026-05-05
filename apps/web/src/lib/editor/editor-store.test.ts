import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parsePageDocument } from "@/lib/openframe";

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
});
