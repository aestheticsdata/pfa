"use client";

import { areaPath, linePath, smoothPath } from "@lib/dataviz/linePaths";
import { extent, linearScale, normalizePoints } from "@lib/dataviz/scales";
import { cn } from "@lib/utils";

import type { AxisMarker, LinePoint, LineSeries, SeriesDot } from "@lib/dataviz/interfaces/dataVizTypes";

interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

interface LineChartProps {
  series: LineSeries[];
  width?: number;
  height?: number;
  padding?: Padding;
  xDomain?: [number, number];
  yDomain?: [number, number];
  /** Baseline (data-y) the area fills down to. Defaults to the y-domain min. */
  baseline?: number;
  markers?: AxisMarker[];
  dots?: SeriesDot[];
  /** Number of evenly-spaced horizontal grid lines. */
  gridLines?: number;
  /** Number of evenly-spaced vertical grid lines (dashed). */
  verticalGrid?: number;
  /** Render grid lines dashed instead of solid. */
  dashedGrid?: boolean;
  /**
   * Stable id prefix; when set, area fills use a vertical gradient. Must be
   * unique per mounted chart (avoids gradient-id collisions) and deterministic
   * (avoids hydration mismatch — do NOT pass a random value).
   */
  id?: string;
  className?: string;
  ariaLabel?: string;
}

const DEFAULT_COLOR = "var(--accent-strong)";

const LineChart = ({
  series,
  width = 600,
  height = 110,
  padding,
  xDomain,
  yDomain,
  baseline,
  markers = [],
  dots = [],
  gridLines = 0,
  verticalGrid = 0,
  dashedGrid = false,
  id,
  className,
  ariaLabel,
}: LineChartProps) => {
  const pad = { top: 6, right: 6, bottom: 6, left: 6, ...padding };

  const normalized: LinePoint[][] = series.map((s) => normalizePoints(s.points));
  const allX = normalized.flat().map((p) => p.x);
  const allY = normalized.flat().map((p) => p.y);

  const [xMin, xMax] = xDomain ?? extent(allX);
  const [yMinRaw, yMaxRaw] = yDomain ?? extent(allY);
  // area charts read best anchored at 0 unless told otherwise
  const yMin = yDomain ? yMinRaw : Math.min(0, yMinRaw);
  const yMax = yMaxRaw;

  const sx = linearScale(xMin, xMax, pad.left, width - pad.right);
  const sy = linearScale(yMin, yMax, height - pad.bottom, pad.top);
  const baseY = sy(baseline ?? yMin);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      className={cn("block", className)}
    >
      {id &&
        series.map((s, i) =>
          s.area ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: series is a fixed positional list; each gradient id is linked to its series by index
            <defs key={`def-${i}`}>
              <linearGradient
                id={`${id}-a${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={s.color ?? DEFAULT_COLOR}
                  stopOpacity="0.28"
                />
                <stop
                  offset="100%"
                  stopColor={s.color ?? DEFAULT_COLOR}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
          ) : null,
        )}

      {Array.from({ length: gridLines }, (_, i) => {
        const inner = height - pad.top - pad.bottom;
        // a lone grid line sits in the middle; 2+ span top→bottom edges
        const y = gridLines === 1 ? pad.top + inner / 2 : pad.top + (inner * i) / (gridLines - 1);
        return (
          <line
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed count of evenly-spaced grid lines built from Array.from
            key={`grid-${i}`}
            x1={pad.left}
            x2={width - pad.right}
            y1={y}
            y2={y}
            stroke="var(--line-soft)"
            strokeWidth={1}
            strokeDasharray={dashedGrid ? "3 4" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {Array.from({ length: verticalGrid }, (_, i) => {
        const innerW = width - pad.left - pad.right;
        const x = verticalGrid === 1 ? pad.left + innerW / 2 : pad.left + (innerW * i) / (verticalGrid - 1);
        return (
          <line
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed count of evenly-spaced vertical grid lines built from Array.from
            key={`vgrid-${i}`}
            x1={x}
            x2={x}
            y1={pad.top}
            y2={height - pad.bottom}
            stroke="var(--line-soft)"
            strokeWidth={1}
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {normalized.map((pts, i) => {
        if (pts.length === 0) return null;
        const s = series[i];
        const color = s.color ?? DEFAULT_COLOR;
        const pixels = pts.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: series is a fixed positional list; s.color/s.area carry no stable id and series[i] is referenced by index
          <g key={`s-${i}`}>
            {s.area && pixels.length > 1 && (
              <path
                d={areaPath(pixels, baseY, s.smooth)}
                fill={id ? `url(#${id}-a${i})` : color}
                fillOpacity={id ? 1 : 0.14}
                stroke="none"
              />
            )}
            {pixels.length > 1 && (
              <path
                d={s.smooth ? smoothPath(pixels) : linePath(pixels)}
                fill="none"
                stroke={color}
                strokeWidth={s.width ?? 1.75}
                strokeDasharray={s.dashed ? "3 4" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        );
      })}

      {markers.map((m) => (
        <line
          key={`m-${m.x}`}
          x1={sx(m.x)}
          x2={sx(m.x)}
          y1={pad.top}
          y2={height - pad.bottom}
          stroke={m.color ?? "var(--ink-3)"}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {dots.map((d) => (
        <circle
          key={`d-${d.x}-${d.y}`}
          cx={sx(d.x)}
          cy={sy(d.y)}
          r={3.5}
          fill="var(--surface-elev)"
          stroke={d.color ?? DEFAULT_COLOR}
          strokeWidth={1.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
};

export default LineChart;
