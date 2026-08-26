"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eases a number toward `target` whenever it changes, starting *at* the first
 * target — no animation on mount, unlike `useTween`, which always grows from 0.
 * A change mid-flight eases from wherever the value currently is, so a toggle
 * flipped twice in a row never snaps.
 *
 * The curve is the app's ease-out cubic, and the tween runs in JS on purpose: CSS
 * transitions over SVG geometry (`y`, `height`) only animate where the browser
 * exposes those attributes to CSS, and die entirely under a reduced-motion rule.
 * Whether to animate at all is the caller's call, not this hook's.
 */
export default function useTweenTo(target: number, duration = 420): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return; // already there → no rAF churn
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      const next = from + (target - from) * (1 - (1 - p) ** 3);
      fromRef.current = next;
      setValue(next);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
