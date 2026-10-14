import TooltipBody from "@components/ui/TooltipBody";
import { hasActivity, sliceWhen } from "@lib/panel/slices";
import { CHART_TEXT } from "@text/charts";

import type { SliceTooltipProps } from "@components/panel/shared/slice/interfaces/sliceTypes";

/** A chart slice's tooltip (PFA-229): the chart's figures for the slice, when it was, and whether it opens. */
const SliceTooltip = ({ title, point, seconds, rows }: SliceTooltipProps) => (
  <TooltipBody
    title={title}
    sub={sliceWhen(point.at, seconds)}
    rows={rows}
    hint={hasActivity(point) ? CHART_TEXT.hint : undefined}
  />
);

export default SliceTooltip;
