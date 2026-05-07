"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BUILTIN_PRESETS,
  type BuiltinPresetAccent,
  type BuiltinPresetDefinition,
} from "@/lib/editor/builtin-presets";
import type { PresetApplyMode } from "@/lib/editor/preset-types";
import type { StoredUserPreset } from "@/lib/editor/user-presets-storage";
import { loadUserPresets } from "@/lib/editor/user-presets-storage";
import { useEditorStore } from "@/lib/editor";

type TabId = "builtin" | "user";

const ACCENT_PREVIEW: Record<BuiltinPresetAccent, string> = {
  blue: "linear-gradient(135deg, rgb(59 130 246 / 0.35), rgb(15 23 42 / 0.9))",
  violet: "linear-gradient(135deg, rgb(139 92 246 / 0.35), rgb(15 23 42 / 0.9))",
  emerald: "linear-gradient(135deg, rgb(16 185 129 / 0.35), rgb(15 23 42 / 0.9))",
  amber: "linear-gradient(135deg, rgb(245 158 11 / 0.35), rgb(15 23 42 / 0.9))",
};

function ApplyModeSegment({
  value,
  onChange,
  replaceDisabled,
}: {
  value: PresetApplyMode;
  onChange: (v: PresetApplyMode) => void;
  replaceDisabled: boolean;
}) {
  const modes: { id: PresetApplyMode; label: string }[] = [
    { id: "before", label: "Above" },
    { id: "after", label: "Below" },
    { id: "replace", label: "Replace" },
  ];
  return (
    <div className="ec-tab-segment inline-flex flex-wrap gap-0.5 rounded-lg p-1" role="group" aria-label="Insert mode">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={m.id === "replace" && replaceDisabled}
          className={`ec-tab-segment-btn rounded-md px-2.5 py-1 text-[11px] font-medium ${
            value === m.id ? "ec-tab-segment-btn-active" : ""
          } ${m.id === "replace" && replaceDisabled ? "cursor-not-allowed opacity-40" : ""}`}
          onClick={() => {
            if (m.id === "replace" && replaceDisabled) {
              return;
            }
            onChange(m.id);
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function PresetPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("builtin");
  const [applyMode, setApplyMode] = useState<PresetApplyMode>("after");
  const [userPresets, setUserPresets] = useState<StoredUserPreset[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const documentRootId = useEditorStore((s) => s.document?.root.id ?? null);
  const applyPresetSubtree = useEditorStore((s) => s.applyPresetSubtree);
  const saveUserPresetFromSelection = useEditorStore((s) => s.saveUserPresetFromSelection);
  const deleteUserPresetById = useEditorStore((s) => s.deleteUserPresetById);

  const replaceDisabled = selectedNodeId != null && documentRootId != null && selectedNodeId === documentRootId;

  useEffect(() => {
    if (replaceDisabled && applyMode === "replace") {
      setApplyMode("after");
    }
  }, [replaceDisabled, applyMode]);

  const refreshUserPresets = useCallback(() => {
    setUserPresets(loadUserPresets());
  }, []);

  useEffect(() => {
    if (open) {
      refreshUserPresets();
      setSaveError(null);
    }
  }, [open, refreshUserPresets]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const applyBuiltin = useCallback(
    (preset: BuiltinPresetDefinition) => {
      const ok = applyPresetSubtree(preset.root, applyMode);
      if (ok) {
        onClose();
      }
    },
    [applyPresetSubtree, applyMode, onClose],
  );

  const applyUser = useCallback(
    (preset: StoredUserPreset) => {
      const ok = applyPresetSubtree(preset.root, applyMode);
      if (ok) {
        onClose();
      }
    },
    [applyPresetSubtree, applyMode, onClose],
  );

  const onSaveUserPreset = useCallback(() => {
    setSaveError(null);
    const res = saveUserPresetFromSelection(saveName, saveDescription || undefined);
    if (!res.ok) {
      setSaveError(res.error ?? "Could not save");
      return;
    }
    setSaveName("");
    setSaveDescription("");
    refreshUserPresets();
    setTab("user");
  }, [saveName, saveDescription, saveUserPresetFromSelection, refreshUserPresets]);

  const formattedUserRows = useMemo(
    () =>
      [...userPresets].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [userPresets],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="ec-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default border-0 bg-black/55"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="ec-modal-dialog relative flex max-h-[min(85vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-[0_24px_48px_rgb(0_0_0/0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-modal-title"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--editor-border-subtle)] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="preset-modal-title" className="text-[15px] font-semibold tracking-tight text-[var(--editor-text)]">
                Layer presets
              </h2>
              <p className="mt-0.5 text-[12px] text-[var(--editor-text-muted)]">
                Built-in templates and presets you saved from the layer tree. Applies relative to the current selection.
              </p>
            </div>
            <button
              type="button"
              className="ec-icon-btn rounded-md px-2 py-1 text-[18px] leading-none"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="ec-tab-segment inline-flex gap-0.5 rounded-lg p-1">
              <button
                type="button"
                className={`ec-tab-segment-btn rounded-md px-3 py-1.5 text-[12px] ${tab === "builtin" ? "ec-tab-segment-btn-active" : ""}`}
                onClick={() => setTab("builtin")}
              >
                Built-in
              </button>
              <button
                type="button"
                className={`ec-tab-segment-btn rounded-md px-3 py-1.5 text-[12px] ${tab === "user" ? "ec-tab-segment-btn-active" : ""}`}
                onClick={() => setTab("user")}
              >
                My presets ({userPresets.length})
              </button>
            </div>
            <ApplyModeSegment value={applyMode} onChange={setApplyMode} replaceDisabled={replaceDisabled} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {tab === "builtin" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BUILTIN_PRESETS.map((preset) => (
                <article
                  key={preset.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-[var(--editor-border-subtle)] bg-[var(--editor-surface-inset)]"
                >
                  <div
                    className="relative aspect-[16/10] w-full border-b border-[var(--editor-border-subtle)]"
                    style={{ background: ACCENT_PREVIEW[preset.accent] }}
                  >
                    <span className="absolute bottom-2 left-2 rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white/90">
                      {preset.root.type}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h3 className="text-[13px] font-medium text-[var(--editor-text)]">{preset.title}</h3>
                    <p className="flex-1 text-[11px] leading-snug text-[var(--editor-text-muted)]">{preset.description}</p>
                    <button type="button" className="ec-props-action-btn mt-1 w-full text-[12px]" onClick={() => applyBuiltin(preset)}>
                      Apply
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {formattedUserRows.length === 0 ? (
                <p className="text-[13px] text-[var(--editor-text-muted)]">
                  No saved presets yet. Use “Save current layer” below while a layer is selected.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {formattedUserRows.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--editor-border-subtle)] bg-[var(--editor-surface-inset)] px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-[var(--editor-text)]">{p.name}</div>
                        {p.description ? (
                          <div className="truncate text-[11px] text-[var(--editor-text-muted)]">{p.description}</div>
                        ) : null}
                        <div className="mt-0.5 font-mono text-[10px] text-[var(--editor-text-faint)]">
                          {new Date(p.createdAt).toLocaleString()} · root: {p.root.type}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" className="ec-props-action-btn px-3 py-1.5 text-[12px]" onClick={() => applyUser(p)}>
                          Apply
                        </button>
                        <button
                          type="button"
                          className="ec-props-danger-btn px-3 py-1.5 text-[12px]"
                          onClick={() => {
                            deleteUserPresetById(p.id);
                            refreshUserPresets();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--editor-border-subtle)] bg-[var(--editor-surface-muted)] px-4 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--editor-text-label)]">Save current layer</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[11px] text-[var(--editor-text-muted)]">Name</span>
              <input
                type="text"
                className="ec-input rounded-md px-2.5 py-1.5 text-[13px]"
                value={saveName}
                placeholder="My pricing card"
                maxLength={128}
                onChange={(e) => setSaveName(e.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-[2] flex-col gap-1">
              <span className="text-[11px] text-[var(--editor-text-muted)]">Description (optional)</span>
              <input
                type="text"
                className="ec-input rounded-md px-2.5 py-1.5 text-[13px]"
                value={saveDescription}
                placeholder="Optional note"
                maxLength={500}
                onChange={(e) => setSaveDescription(e.target.value)}
              />
            </label>
            <button type="button" className="ec-btn-primary shrink-0 rounded-md px-4 py-2 text-[12px] font-medium" onClick={onSaveUserPreset}>
              Save preset
            </button>
          </div>
          {saveError ? <p className="mt-2 text-[12px] text-[var(--editor-danger-text)]">{saveError}</p> : null}
        </div>
      </div>
    </div>
  );
}
