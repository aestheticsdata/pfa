"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks the pixel width of a DOM node via ResizeObserver so a chart can render
 * its SVG with a 1:1 viewBox — crisp text and perfectly round dots, none of the
 * horizontal distortion a stretched `preserveAspectRatio="none"` viewBox causes.
 *
 * Returns `[ref, width]`; `width` stays `fallback` until the node is measured.
 */
export default function useElementWidth<T extends HTMLElement>(fallback = 0): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // contentRect fires async (not during render), so this setState is allowed.
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
