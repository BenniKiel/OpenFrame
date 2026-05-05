"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import type { ScrollRevealPreset } from "../motion-presets";

type Props = {
  preset: ScrollRevealPreset;
  children: ReactNode;
};

/**
 * Scroll-driven reveal: runs only in the browser inside the page / draft iframe.
 * Before client mount, renders `children` unwrapped to avoid hydration mismatch and
 * permanent hidden content without JS (see `globals.css` `scripting: none` fallback).
 */
export function ScrollReveal({ preset, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted || preset === "none") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const reduced =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
    if (reduced) {
      setRevealed(true);
      return;
    }
    const el = ref.current;
    if (!el) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, preset]);

  if (preset === "none") {
    return <>{children}</>;
  }

  if (!mounted) {
    return <>{children}</>;
  }

  const hidden =
    !revealed &&
    (preset === "fade-up"
      ? "opacity-0 translate-y-6"
      : preset === "slide-left"
        ? "opacity-0 -translate-x-6"
        : "opacity-0");

  const shown = revealed ? "opacity-100 translate-x-0 translate-y-0" : hidden;

  return (
    <div
      ref={ref}
      data-of-scroll-reveal={preset}
      className={`max-w-full min-w-0 transition-all duration-700 ease-out ${shown}`}
    >
      {children}
    </div>
  );
}
