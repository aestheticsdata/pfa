"use client";

import { useEffect, useState } from "react";

import type { RefObject } from "react";

const isSameRect = (a: DOMRect, b: DOMRect) =>
  a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

/**
 * The viewport box of `ref`'s element, followed frame by frame while mounted —
 * window scroll, an inner list's scroll and layout shifts all move it, and no
 * single event covers the three. Only re-renders when the box actually moves.
 * Meant for short-lived overlays; a permanent one would want observers instead.
 */
export const useTrackedRect = (ref: RefObject<HTMLElement | null>) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const next = ref.current?.getBoundingClientRect();
      if (next) {
        setRect((prev) => (prev && isSameRect(prev, next) ? prev : next));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref]);

  return rect;
};
