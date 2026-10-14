"use client";

import useCursorHover from "@components/hooks/useCursorHover";

import type { PlotHover } from "@lib/dataviz/interfaces/dataVizTypes";

/**
 * A chart's hover (PFA-229): the dataviz lib reports the datum under the pointer (`onHover`), this
 * keeps it for a `CursorTooltip` (`hover`) and for the lit column or crosshair (`index`).
 */
export default function usePlotHover() {
  const { hover, show, clear } = useCursorHover<number>();
  const onHover = (plot: PlotHover | null) => (plot ? show(plot.x, plot.y, plot.index) : clear());
  return { hover, index: hover?.data ?? null, onHover };
}
