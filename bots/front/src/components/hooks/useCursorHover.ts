"use client";

import { useState } from "react";

import type { CursorHover } from "@components/hooks/interfaces/cursorTypes";

/**
 * The hover state behind a `CursorTooltip` (as PFA's): where the pointer is and what it is over.
 * Keep `data` a key (an index, a name) rather than a copy of the datum, so the tooltip re-reads the
 * live figures when the page refreshes under a still pointer.
 */
export default function useCursorHover<T>() {
  const [hover, setHover] = useState<CursorHover<T> | null>(null);
  const show = (x: number, y: number, data: T) => setHover({ x, y, data });
  const clear = () => setHover(null);
  return { hover, show, clear };
}
