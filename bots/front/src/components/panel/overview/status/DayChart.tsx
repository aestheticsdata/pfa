"use client";

import usePlotHover from "@components/hooks/usePlotHover";
import LegendItem from "@components/panel/metrics/LegendItem";
import useSliceSelection from "@components/panel/shared/slice/hooks/useSliceSelection";
import SliceDetailModal from "@components/panel/shared/slice/SliceDetailModal";
import SliceTooltip from "@components/panel/shared/slice/SliceTooltip";
import CursorTooltip from "@components/ui/CursorTooltip";
import StackedColumns from "@lib/dataviz/StackedColumns";
import { actionColor } from "@lib/panel/actionColors";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { SLICE_SECONDS, sliceSpan } from "@lib/panel/slices";
import { sliceActionRows } from "@lib/panel/tooltipRows";
import { OVERVIEW_TEXT } from "@text/overview";

import type { StatusChartProps } from "@components/panel/overview/interfaces/overviewTypes";
import type { ActivityPoint } from "@contracts/interfaces/panelTypes";

/** Actions of the slice that no action name accounts for. */
const unattributed = (slice: ActivityPoint) =>
  Math.max(0, slice.actions - Object.values(slice.byAction).reduce((sum, runs) => sum + runs, 0));

/**
 * The last 24 h in daily pace (PFA-206): one bar every 15 min, stacked by action in the Metrics
 * mix's colours, errors on top in red. Each bar has its tooltip (PFA-229); a bar with activity
 * opens its detail, an empty one doesn't.
 */
const DayChart = ({ app, history, actionNames, dailyIds }: StatusChartProps) => {
  const text = OVERVIEW_TEXT.status;
  const seconds = SLICE_SECONDS.day;
  const slices = useSliceSelection(history);
  const { hover, index, onHover } = usePlotHover();
  const hovered = index === null ? undefined : history[index];
  const seen = actionNames.filter((name) => history.some((point) => (point.byAction[name] ?? 0) > 0));
  return (
    <>
      <div className="mb-2.5 flex flex-wrap justify-between gap-2 text-xs text-dim">
        <span>{text.chartDay}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono">
          {seen.map((name) => (
            <LegendItem
              key={name}
              color={actionColor(actionNames, name)}
              label={name}
            />
          ))}
          {history.some((slice) => slice.errors > 0) && (
            <LegendItem
              color={CHART_COLOR.errors}
              label={text.errorsLegend}
            />
          )}
        </div>
      </div>
      <StackedColumns
        className="chart-plot gap-px"
        ariaLabel={text.chartDay}
        onSelect={slices.select}
        onHover={onHover}
        active={index}
        columns={history.map((slice) => ({
          key: slice.at,
          label: text.sliceLabel(sliceSpan(slice.at, seconds), slice.actions),
          parts: [
            ...actionNames.map((name) => ({
              label: name,
              value: slice.byAction[name] ?? 0,
              color: actionColor(actionNames, name),
            })),
            // Slices saved before PFA-206 have no breakdown: their actions show as one grey block.
            { label: "other", value: unattributed(slice), color: CHART_COLOR.other },
            { label: "errors", value: slice.errors, color: CHART_COLOR.errors },
          ],
        }))}
      />
      <div className="mt-1.5 flex justify-between font-mono text-tiny text-dim">
        {text.axisDay.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <CursorTooltip point={hover}>
        {hovered && (
          <SliceTooltip
            title={text.chartDay}
            point={hovered}
            seconds={seconds}
            rows={sliceActionRows({ point: hovered, actionNames })}
          />
        )}
      </CursorTooltip>
      {/* Always mounted, so closing plays its animation before the content goes. */}
      <SliceDetailModal
        app={app}
        point={slices.point}
        seconds={seconds}
        actionNames={actionNames}
        dailyIds={dailyIds}
        open={slices.open}
        onClose={slices.close}
      />
    </>
  );
};

export default DayChart;
