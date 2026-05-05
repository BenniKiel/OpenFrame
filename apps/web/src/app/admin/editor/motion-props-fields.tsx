"use client";

import { isMotionProEnabled } from "@/lib/preview/motion-capabilities";
import type { NormalizedBlockMotion } from "@/lib/preview/motion-contract";
import { MOTION_ENGINES, TIMELINE_PRESETS } from "@/lib/preview/motion-contract";
import { SCROLL_REVEAL_PRESETS } from "@/lib/preview/motion-presets";

type Props = {
  nodeId: string;
  motion: NormalizedBlockMotion;
  updateNodeProps: (nodeId: string, props: Record<string, unknown>) => void;
};

export function MotionPropsFields({ nodeId, motion: p, updateNodeProps }: Props) {
  const pro = isMotionProEnabled();
  const gsapActive = p.motionEngine === "gsap";
  const patchScrollTrigger = (partial: Partial<NormalizedBlockMotion["scrollTrigger"]>) => {
    updateNodeProps(nodeId, {
      scrollTrigger: {
        ...p.scrollTrigger,
        ...partial,
      },
    });
  };

  const scrubKey =
    p.scrollTrigger.scrub === false ? "off" : p.scrollTrigger.scrub === true ? "smooth" : `n:${p.scrollTrigger.scrub}`;

  const scrubOptions = ["off", "smooth", "n:0.5", "n:1"] as const;

  const setScrubFromKey = (key: string) => {
    if (key === "off") {
      patchScrollTrigger({ scrub: false });
    } else if (key === "smooth") {
      patchScrollTrigger({ scrub: true });
    } else if (key.startsWith("n:")) {
      const n = Number(key.slice(2));
      patchScrollTrigger({ scrub: Number.isFinite(n) ? n : false });
    }
  };

  const timelineDisabled = !gsapActive;
  const triggerDisabled = !gsapActive || p.timelinePreset === "none";

  return (
    <div className="mt-1 grid grid-cols-1 gap-2">
      {!pro ? (
        <p className="ec-props-hint rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-amber-900 dark:text-amber-100">
          <strong>Motion Pro aus:</strong> GSAP-Timelines laufen im Preview erst mit{" "}
          <code className="font-mono">NEXT_PUBLIC_OPENFRAME_MOTION_PRO=1</code>. Open-Core{" "}
          <strong>Scroll reveal</strong> funktioniert weiterhin.
        </p>
      ) : null}
      {gsapActive && !pro ? (
        <p className="ec-props-hint rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-amber-900 dark:text-amber-100">
          Dokument nutzt <strong>motionEngine: gsap</strong>, aber Pro ist im Build nicht aktiv — Preview fällt auf{" "}
          <strong>Scroll reveal</strong> zurück.
        </p>
      ) : null}

      <label className="ec-label flex flex-col gap-1 text-[11px]">
        <span className="ec-text-muted">Scroll reveal (Open-Core)</span>
        <select
          className="ec-input rounded-md px-2 py-1.5 text-[12px]"
          value={p.scrollReveal}
          onChange={(e) => updateNodeProps(nodeId, { scrollReveal: e.target.value })}
        >
          {SCROLL_REVEAL_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
      </label>

      <label className="ec-label flex flex-col gap-1 text-[11px]">
        <span className="ec-text-muted">Motion engine</span>
        <select
          className="ec-input rounded-md px-2 py-1.5 text-[12px]"
          value={p.motionEngine}
          onChange={(e) => updateNodeProps(nodeId, { motionEngine: e.target.value })}
        >
          {MOTION_ENGINES.map((m) => (
            <option key={m} value={m}>
              {m}
              {m === "gsap" ? " (GSAP + ScrollTrigger)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="ec-label flex flex-col gap-1 text-[11px]">
        <span className="ec-text-muted">Timeline preset (Pro)</span>
        <select
          className="ec-input rounded-md px-2 py-1.5 text-[12px]"
          value={p.timelinePreset}
          disabled={timelineDisabled}
          onChange={(e) => updateNodeProps(nodeId, { timelinePreset: e.target.value })}
        >
          {TIMELINE_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
      </label>

      <label className="ec-label flex flex-col gap-1 text-[11px]">
        <span className="ec-text-muted">ScrollTrigger · start</span>
        <input
          type="text"
          className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
          disabled={triggerDisabled}
          value={p.scrollTrigger.start}
          onChange={(e) => patchScrollTrigger({ start: e.target.value })}
        />
      </label>
      <label className="ec-label flex flex-col gap-1 text-[11px]">
        <span className="ec-text-muted">ScrollTrigger · end</span>
        <input
          type="text"
          className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
          disabled={triggerDisabled}
          value={p.scrollTrigger.end}
          onChange={(e) => patchScrollTrigger({ end: e.target.value })}
        />
      </label>

      <label className="ec-label flex flex-col gap-1 text-[11px]">
        <span className="ec-text-muted">ScrollTrigger · scrub</span>
        <select
          className="ec-input rounded-md px-2 py-1.5 text-[12px]"
          disabled={triggerDisabled}
          value={scrubKey}
          onChange={(e) => setScrubFromKey(e.target.value)}
        >
          <option value="off">Off (one-shot)</option>
          <option value="smooth">Smooth (true)</option>
          <option value="n:0.5">Lag 0.5s</option>
          <option value="n:1">Lag 1s</option>
          {!scrubOptions.includes(scrubKey as (typeof scrubOptions)[number]) ? (
            <option value={scrubKey}>Custom ({String(p.scrollTrigger.scrub)})</option>
          ) : null}
        </select>
      </label>

      <label className="ec-label flex flex-row items-center gap-2 text-[11px]">
        <input
          type="checkbox"
          className="rounded border"
          disabled={triggerDisabled}
          checked={p.scrollTrigger.once}
          onChange={(e) => patchScrollTrigger({ once: e.target.checked })}
        />
        <span className="ec-text-muted">ScrollTrigger · once (fire once)</span>
      </label>
    </div>
  );
}
