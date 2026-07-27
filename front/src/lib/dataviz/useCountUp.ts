"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 up to `target` (easeOutCubic) whenever `target`
 * changes — i.e. on mount, when the data loads, and on a month change. Respects
 * prefers-reduced-motion (snaps straight to the value). The setState runs inside
 * requestAnimationFrame (async), not synchronously in the effect.
 *
 * Pass `enabled = false` to bypass and return the raw target — same escape hatch
 * (and same argument order) as the sibling `useTween`, so a component with an
 * opt-in `animate` prop calls the hook unconditionally instead of burning a rAF
 * loop counting to a value it never shows.
 */
export default function useCountUp(target: number, enabled = true, duration = 850): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const reduce =
      typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    let startTs = 0;
    // all setState happens inside rAF (async), never synchronously in the effect
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = reduce ? 1 : Math.min(1, (ts - startTs) / duration);
      const eased = 1 - (1 - p) ** 3;
      setValue(target * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, enabled, duration]);

  return enabled ? value : target;
}
