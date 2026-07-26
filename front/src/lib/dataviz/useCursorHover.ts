"use client";

import { useState } from "react";

import type { CursorPoint } from "@lib/dataviz/interfaces/dataVizTypes";

export interface CursorHover<T> extends CursorPoint {
  data: T;
}

/**
 * Local hover state driving a {@link CursorTooltip}: viewport coords + an
 * optional hovered datum. `T` defaults to `void` for tooltips whose content is
 * fixed (no per-item data) — call `move()` / `show(x, y)` with no datum. For
 * data-driven tooltips pass the datum type, e.g. `useCursorHover<HeatmapCell>()`.
 */
export default function useCursorHover<T = void>() {
  const [hover, setHover] = useState<CursorHover<T> | null>(null);
  /** onMouseMove handler bound to a fixed datum (one interactive element). */
  const move = (data: T) => (e: { clientX: number; clientY: number }) => setHover({ x: e.clientX, y: e.clientY, data });
  /** Imperative setter for delegated containers that resolve the datum per event. */
  const show = (x: number, y: number, data: T) => setHover({ x, y, data });
  const clear = () => setHover(null);
  return { hover, move, show, clear };
}
