"use client";

import { useLayoutEffect, useState } from "react";

import type { CursorPoint } from "@components/hooks/interfaces/cursorTypes";
import type { RefObject } from "react";

/** Gap kept from the pointer, margin kept from the viewport's edges. */
const GAP = 16;
const EDGE = 12;

/**
 * Where a box that follows the pointer goes: below right of it, flipped to the other side when it
 * would cross the viewport's edge. Measured before paint, so it never flashes off-screen.
 */
export default function useViewportClamp(ref: RefObject<HTMLElement | null>, point: CursorPoint | null) {
  const [position, setPosition] = useState<CursorPoint | null>(null);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!point || !box) return;
    const { width, height } = box.getBoundingClientRect();
    const x = point.x + GAP + width + EDGE > window.innerWidth ? point.x - GAP - width : point.x + GAP;
    const y = point.y + GAP + height + EDGE > window.innerHeight ? point.y - GAP - height : point.y + GAP;
    setPosition({ x: Math.max(EDGE, x), y: Math.max(EDGE, y) });
  }, [ref, point]);
  return position ?? (point ? { x: point.x + GAP, y: point.y + GAP } : null);
}
