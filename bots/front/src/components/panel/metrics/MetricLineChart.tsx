"use client";

import usePlotHover from "@components/hooks/usePlotHover";
import CursorTooltip from "@components/ui/CursorTooltip";
import { cx } from "@lib/classNames/cx";
import { hoverOver, pointAt } from "@lib/dataviz/hoverIndex";
import LineChart from "@lib/dataviz/LineChart";
import { normalizePoints } from "@lib/dataviz/scales";

import type { MetricLineChartProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** Headroom over the highest point, so a line never touches the top edge. */
const HEADROOM = 1.15;

/**
 * PFA's LineChart on a 0 → max scale, dashed guides, and the max / half labels on the left. Hovered
 * (PFA-229): a crosshair and a dot per line on the nearest point, its tooltip; a click on a point
 * that `canSelect` opens its detail.
 */
const MetricLineChart = ({ series, unit = "", ariaLabel, tooltip, canSelect, onSelect }: MetricLineChartProps) => {
  const { hover, index, onHover } = usePlotHover();
  const lines = series.map((line) => normalizePoints(line.points));
  const length = Math.max(0, ...lines.map((points) => points.length));
  const peak = Math.max(1, ...lines.flatMap((points) => points.map((point) => point.y)));
  const max = peak * HEADROOM;
  const selectable = index !== null && canSelect(index);
  /** A point's x, in % of the plot: the points spread edge to edge. */
  const x = (at: number) => (length > 1 ? (at / (length - 1)) * 100 : 50);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut; each slice's detail is also reachable from the Overview's chart
    // biome-ignore lint/a11y/useKeyWithClickEvents: same — the crosshair follows the mouse only
    <div
      className={cx("relative h-27.5 border-b border-line", selectable && "cursor-pointer")}
      onMouseMove={(event) => onHover(hoverOver(event, length, pointAt))}
      onMouseLeave={() => onHover(null)}
      onClick={() => selectable && onSelect(index)}
    >
      <LineChart
        series={series}
        height={110}
        yDomain={[0, max]}
        gridLines={5}
        dashedGrid
        padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        ariaLabel={ariaLabel}
      />
      {/* HTML, not SVG: the plot stretches (`preserveAspectRatio="none"`), a circle would turn oval. */}
      {index !== null && (
        <div
          className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-muted/60"
          style={{ left: `${x(index)}%` }}
        >
          {series.map((line, i) => {
            const point = lines[i]?.[index];
            return (
              point && (
                <i
                  // biome-ignore lint/suspicious/noArrayIndexKey: series is a fixed positional list
                  key={i}
                  className="absolute left-1/2 block size-2 -translate-1/2 rounded-full border-2 bg-panel"
                  style={{ top: `${100 - (point.y / max) * 100}%`, borderColor: line.color }}
                />
              )
            );
          })}
        </div>
      )}
      {[0, 50].map((top) => (
        <span
          key={top}
          className="pointer-events-none absolute left-0 -translate-y-1/2 bg-panel pr-1 font-mono text-micro text-dim"
          style={{ top: `${top}%` }}
        >
          {Math.round(top === 0 ? max : max / 2)}
          {unit}
        </span>
      ))}
      <CursorTooltip point={hover}>{index !== null && tooltip(index)}</CursorTooltip>
    </div>
  );
};

export default MetricLineChart;
