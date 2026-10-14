"use client";

import usePlotHover from "@components/hooks/usePlotHover";
import ChartCard from "@components/panel/metrics/ChartCard";
import LegendItem from "@components/panel/metrics/LegendItem";
import SliceTooltip from "@components/panel/shared/slice/SliceTooltip";
import CursorTooltip from "@components/ui/CursorTooltip";
import StackedColumns from "@lib/dataviz/StackedColumns";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { SLICE_SECONDS, sliceSpan } from "@lib/panel/slices";
import { codesRows } from "@lib/panel/tooltipRows";
import { METRICS_TEXT } from "@text/metrics";

import type { SliceChartProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** The app's answers per slice, 2xx under 4xx under 5xx; a slice with requests opens its detail. */
const CodesCard = ({ history, seconds, onSelect }: SliceChartProps) => {
  const { hover, index, onHover } = usePlotHover();
  const last = history[history.length - 1];
  const max = Math.max(1, ...history.map((point) => point.codes2xx + point.codes4xx + point.codes5xx));
  const hovered = index === null ? undefined : history[index];
  return (
    <ChartCard
      title={METRICS_TEXT.codes}
      axis={seconds === SLICE_SECONDS.day ? METRICS_TEXT.codesAxisDay : METRICS_TEXT.codesAxis}
      legend={
        <>
          <LegendItem
            color={CHART_COLOR.codes2xx}
            label="2xx"
          />
          <LegendItem
            color={CHART_COLOR.codes4xx}
            label="4xx"
            value={String(last?.codes4xx ?? 0)}
          />
          <LegendItem
            color={CHART_COLOR.codes5xx}
            label="5xx"
            value={String(last?.codes5xx ?? 0)}
          />
        </>
      }
    >
      <StackedColumns
        className="h-32.5 gap-px tablet:gap-0.5"
        max={max}
        ariaLabel={METRICS_TEXT.codes}
        onSelect={onSelect}
        onHover={onHover}
        active={index}
        columns={history.map((point) => ({
          key: point.at,
          label: `${METRICS_TEXT.codes} · ${sliceSpan(point.at, seconds)}`,
          parts: [
            { label: "5xx", value: point.codes5xx, color: CHART_COLOR.codes5xx },
            { label: "4xx", value: point.codes4xx, color: CHART_COLOR.codes4xx },
            { label: "2xx", value: point.codes2xx, color: CHART_COLOR.codes2xx },
          ],
        }))}
      />
      <CursorTooltip point={hover}>
        {hovered && (
          <SliceTooltip
            title={METRICS_TEXT.codes}
            point={hovered}
            seconds={seconds}
            rows={codesRows(hovered, seconds)}
          />
        )}
      </CursorTooltip>
    </ChartCard>
  );
};

export default CodesCard;
