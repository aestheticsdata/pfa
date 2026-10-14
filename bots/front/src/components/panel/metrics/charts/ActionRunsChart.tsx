"use client";

import usePlotHover from "@components/hooks/usePlotHover";
import CursorTooltip from "@components/ui/CursorTooltip";
import TooltipBody from "@components/ui/TooltipBody";
import StackedColumns from "@lib/dataviz/StackedColumns";
import { count } from "@lib/format/format";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { SLICE_SECONDS, sliceWhen } from "@lib/panel/slices";
import { CHART_TEXT } from "@text/charts";

import type { ActionRunsChartProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** One action's runs per slice over the window, its failures on top, each slice with its tooltip. */
const ActionRunsChart = ({ name, color, history, seconds }: ActionRunsChartProps) => {
  const { hover, index, onHover } = usePlotHover();
  const hovered = index === null ? undefined : history[index];
  return (
    <>
      <StackedColumns
        className="h-20 gap-px"
        ariaLabel={CHART_TEXT.actionModal.over(seconds === SLICE_SECONDS.day)}
        onHover={onHover}
        active={index}
        columns={history.map((point) => ({
          key: point.at,
          parts: [
            { label: CHART_TEXT.errors, value: point.errorsByAction[name] ?? 0, color: CHART_COLOR.errors },
            { label: CHART_TEXT.action.runs, value: point.byAction[name] ?? 0, color },
          ],
        }))}
      />
      <CursorTooltip point={hover}>
        {hovered && (
          <TooltipBody
            title={name}
            sub={sliceWhen(hovered.at, seconds)}
            rows={[
              { label: CHART_TEXT.action.runs, value: count(hovered.byAction[name] ?? 0), color },
              {
                label: CHART_TEXT.errors,
                value: count(hovered.errorsByAction[name] ?? 0),
                color: CHART_COLOR.errors,
                bad: (hovered.errorsByAction[name] ?? 0) > 0,
              },
            ]}
          />
        )}
      </CursorTooltip>
    </>
  );
};

export default ActionRunsChart;
