"use client";

import usePlotHover from "@components/hooks/usePlotHover";
import useSliceSelection from "@components/panel/shared/slice/hooks/useSliceSelection";
import SliceDetailModal from "@components/panel/shared/slice/SliceDetailModal";
import SliceTooltip from "@components/panel/shared/slice/SliceTooltip";
import CursorTooltip from "@components/ui/CursorTooltip";
import GradientColumns from "@lib/dataviz/GradientColumns";
import { SLICE_SECONDS } from "@lib/panel/slices";
import { activityRows } from "@lib/panel/tooltipRows";
import { OVERVIEW_TEXT } from "@text/overview";

import type { StatusChartProps } from "@components/panel/overview/interfaces/overviewTypes";

/**
 * The last 80 s in burst pace: one bar a second, read as actions/min. Each bar has its tooltip; a
 * bar with activity opens that second's detail (PFA-229).
 */
const BurstChart = ({ app, history, actionNames, dailyIds }: StatusChartProps) => {
  const text = OVERVIEW_TEXT.status;
  const seconds = SLICE_SECONDS.burst;
  const slices = useSliceSelection(history);
  const { hover, index, onHover } = usePlotHover();
  const hovered = index === null ? undefined : history[index];
  return (
    <>
      <div className="mb-2.5 flex flex-wrap justify-between gap-2 text-xs text-dim">
        <span>{text.chart}</span>
      </div>
      <GradientColumns
        values={history.map((point) => point.actions)}
        className="gap-px tablet:gap-0.5"
        ariaLabel={text.chart}
        onSelect={slices.select}
        onHover={onHover}
        active={index}
      />
      <div className="mt-1.5 flex justify-between font-mono text-tiny text-dim">
        {text.axis.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <CursorTooltip point={hover}>
        {hovered && (
          <SliceTooltip
            title={text.chart}
            point={hovered}
            seconds={seconds}
            rows={activityRows(hovered, seconds)}
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

export default BurstChart;
