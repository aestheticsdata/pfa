import LineChart from "@lib/dataviz/LineChart";
import { normalizePoints } from "@lib/dataviz/scales";

import type { MetricLineChartProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** Headroom over the highest point, so a line never touches the top edge. */
const HEADROOM = 1.15;

/** PFA's LineChart on a 0 → max scale, dashed guides, and the max / half labels on the left. */
const MetricLineChart = ({ series, unit = "", ariaLabel }: MetricLineChartProps) => {
  const peak = Math.max(1, ...series.flatMap((line) => normalizePoints(line.points).map((point) => point.y)));
  const max = peak * HEADROOM;
  return (
    <div className="relative h-27.5 border-b border-line">
      <LineChart
        series={series}
        height={110}
        yDomain={[0, max]}
        gridLines={5}
        dashedGrid
        padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        ariaLabel={ariaLabel}
      />
      {[0, 50].map((top) => (
        <span
          key={top}
          className="absolute left-0 -translate-y-1/2 bg-panel pr-1 font-mono text-micro text-dim"
          style={{ top: `${top}%` }}
        >
          {Math.round(top === 0 ? max : max / 2)}
          {unit}
        </span>
      ))}
    </div>
  );
};

export default MetricLineChart;
