"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eases a number toward `target` whenever it changes, starting from wherever the
 * value currently is — 0 on first mount (grow-from-zero, incl. after a remount via
 * `key`), the current displayed value on a live update (ease-from-current).
 *
 * Unlike `useCountUp` (which always restarts from 0), this remembers the last
 * rendered value, so an in-place change animates from where the bar actually is.
 * Respects prefers-reduced-motion (snaps). Pass `enabled = false` to bypass and
 * return the raw target. All setState runs inside requestAnimationFrame (async).
 */
export default function useTween(target: number, enabled = true, duration = 650, delay = 0): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const from = fromRef.current;
    if (from === target) return; // nothing to animate → no rAF churn
    const reduce =
      typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs - delay;
      const p = elapsed <= 0 ? 0 : reduce ? 1 : Math.min(1, elapsed / duration);
      const eased = 1 - (1 - p) ** 3;
      const next = from + (target - from) * eased;
      fromRef.current = next;
      setValue(next);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, enabled, duration, delay]);

  return enabled ? value : target;
}
