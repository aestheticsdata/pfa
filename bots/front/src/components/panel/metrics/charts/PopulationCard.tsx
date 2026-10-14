import ChartCard from "@components/panel/metrics/ChartCard";
import LegendItem from "@components/panel/metrics/LegendItem";
import MetricLineChart from "@components/panel/metrics/MetricLineChart";
import SliceTooltip from "@components/panel/shared/slice/SliceTooltip";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { hasActivity, SLICE_SECONDS } from "@lib/panel/slices";
import { populationRows } from "@lib/panel/tooltipRows";
import { METRICS_TEXT } from "@text/metrics";

import type { SliceChartProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** Live bots against the target, over the window. */
const PopulationCard = ({ history, seconds, onSelect }: SliceChartProps) => {
  const last = history[history.length - 1];
  return (
    <ChartCard
      title={METRICS_TEXT.population}
      axis={seconds === SLICE_SECONDS.day ? METRICS_TEXT.populationAxisDay : METRICS_TEXT.populationAxis}
      legend={
        <>
          <LegendItem
            color={CHART_COLOR.live}
            label={METRICS_TEXT.live}
            value={String(last?.live ?? 0)}
          />
          <LegendItem
            color={CHART_COLOR.target}
            label={METRICS_TEXT.target}
            value={String(last?.target ?? 0)}
          />
        </>
      }
    >
      <MetricLineChart
        ariaLabel={METRICS_TEXT.population}
        series={[
          { points: history.map((point) => point.target), color: CHART_COLOR.target, dashed: true, width: 1.6 },
          { points: history.map((point) => point.live), color: CHART_COLOR.live, width: 1.6 },
        ]}
        tooltip={(index) => {
          const point = history[index];
          return (
            point && (
              <SliceTooltip
                title={METRICS_TEXT.population}
                point={point}
                seconds={seconds}
                rows={populationRows(point)}
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

export default PopulationCard;
