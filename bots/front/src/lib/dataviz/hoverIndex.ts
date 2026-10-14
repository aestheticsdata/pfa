// data-viz lib — which datum the pointer is over (PFA-229).

import type { PlotHover, PlotSpan } from "@lib/dataviz/interfaces/dataVizTypes";
import type { MouseEvent } from "react";

/** Equal columns side by side: the column under `offset` (px from the plot's left edge). */
export function columnAt({ offset, width, count }: PlotSpan): number {
  if (count <= 0 || width <= 0) return -1;
  return Math.min(count - 1, Math.max(0, Math.floor((offset / width) * count)));
}

/** Points spread edge to edge (a line): the point nearest `offset`. */
export function pointAt({ offset, width, count }: PlotSpan): number {
  if (count <= 0 || width <= 0) return -1;
  if (count === 1) return 0;
  return Math.min(count - 1, Math.max(0, Math.round((offset / width) * (count - 1))));
}

/** The datum a mouse event over a plot points at (`columnAt` or `pointAt`), with the pointer. */
export function hoverOver(event: MouseEvent<Element>, count: number, at = columnAt): PlotHover | null {
  const box = event.currentTarget.getBoundingClientRect();
  const index = at({ offset: event.clientX - box.left, width: box.width, count });
  return index < 0 ? null : { index, x: event.clientX, y: event.clientY };
}
