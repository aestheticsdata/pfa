import ChartCard from "@components/panel/metrics/ChartCard";
import LegendItem from "@components/panel/metrics/LegendItem";
import MetricLineChart from "@components/panel/metrics/MetricLineChart";
import SliceTooltip from "@components/panel/shared/slice/SliceTooltip";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { hasActivity, SLICE_SECONDS } from "@lib/panel/slices";
import { latencyRows } from "@lib/panel/tooltipRows";
import { CHART_TEXT } from "@text/charts";
import { METRICS_TEXT } from "@text/metrics";

import type { SliceChartProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** The app's p50 and p95 response times, over the window. */
const LatencyCard = ({ history, seconds, onSelect }: SliceChartProps) => {
  const last = history[history.length - 1];
  return (
    <ChartCard
      title={METRICS_TEXT.latency}
      axis={seconds === SLICE_SECONDS.day ? METRICS_TEXT.latencyAxisDay : METRICS_TEXT.latencyAxis}
      legend={
        <>
          <LegendItem
            color={CHART_COLOR.p50}
            label={CHART_TEXT.p50}
            value={`${last?.p50 ?? 0}ms`}
          />
          <LegendItem
            color={CHART_COLOR.p95}
            label={CHART_TEXT.p95}
            value={`${last?.p95 ?? 0}ms`}
          />
        </>
      }
    >
      <MetricLineChart
        unit="ms"
        ariaLabel={METRICS_TEXT.latency}
        series={[
          { points: history.map((point) => point.p95), color: CHART_COLOR.p95, width: 1.6 },
          { points: history.map((point) => point.p50), color: CHART_COLOR.p50, width: 1.6 },
        ]}
        tooltip={(index) => {
          const point = history[index];
          return (
            point && (
              <SliceTooltip
                title={METRICS_TEXT.latency}
                point={point}
                seconds={seconds}
                rows={latencyRows(point, seconds)}
              />
            )
          );
        }}
        canSelect={(index) => history[index] !== undefined && hasActivity(history[index])}
        onSelect={onSelect}
      />
    </ChartCard>
  );
};

export default LatencyCard;
