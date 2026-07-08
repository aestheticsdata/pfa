"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 up to `target` (easeOutCubic) whenever `target`
 * changes — i.e. on mount, when the data loads, and on a month change. Respects
 * prefers-reduced-motion (snaps straight to the value). The setState runs inside
 * requestAnimationFrame (async), not synchronously in the effect.
 */
export default function useCountUp(target: number, duration = 850): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    let startTs = 0;
    // all setState happens inside rAF (async), never synchronously in the effect
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = reduce ? 1 : Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
