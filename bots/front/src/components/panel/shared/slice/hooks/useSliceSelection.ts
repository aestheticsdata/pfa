"use client";

import { useState } from "react";

import type { ActivityPoint } from "@contracts/interfaces/panelTypes";

/**
 * Which slice of a chart's history the detail modal shows. Kept by its start, not its index: the
 * window slides under an open modal at every refresh. `open` stays apart, so closing plays the
 * modal's animation before its content goes.
 */
export default function useSliceSelection(history: ActivityPoint[]) {
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const point = history.find((slice) => slice.at === selected);
  const select = (index: number) => {
    setSelected(history[index]?.at ?? null);
    setOpen(true);
  };
  const close = () => setOpen(false);
  return { point, open: open && point !== undefined, select, close };
}
