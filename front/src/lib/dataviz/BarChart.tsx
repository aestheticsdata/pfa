"use client";

import { cn } from "@lib/utils";

import type { BarDatum } from "@lib/dataviz/dataVizTypes";

interface BarChartProps {
  bars: BarDatum[];
  orientation?: "vertical" | "horizontal";
  width?: number;
  height?: number;
  /** Domain max; defaults to the largest bar value. */
  max?: number;
  /** Fallback color for bars without their own. */
  color?: string;
  /** Fraction of each band left as spacing (0–1). */
  gap?: number;
  radius?: number;
  trackColor?: string;
  className?: string;
  ariaLabel?: string;
}

const DEFAULT_COLOR = "var(--accent-strong)";

/** Generic SVG bar graph — vertical (default) or horizontal. */
const BarChart = ({
  bars,
  orientation = "vertical",
  width = 300,
  height = 160,
  max,
  color = DEFAULT_COLOR,
  gap = 0.35,
  radius = 2,
  trackColor,
  className,
  ariaLabel,
}: BarChartProps) => {
  const domainMax = max ?? Math.max(1, ...bars.map((b) => b.value));
  const n = Math.max(1, bars.length);

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
      {bars.map((b, i) => {
        const frac = Math.max(0, b.value) / domainMax;
        const fill = b.color ?? color;
        if (orientation === "horizontal") {
          const band = height / n;
          const barH = band * (1 - gap);
          const y = i * band + (band - barH) / 2;
          const w = frac * width;
          return (
            <g key={i}>
              {trackColor && (
                <rect
                  x={0}
                  y={y}
                  width={width}
                  height={barH}
                  rx={radius}
                  fill={trackColor}
                />
              )}
              <rect
                x={0}
                y={y}
                width={Math.max(w, 0.5)}
                height={barH}
                rx={radius}
                fill={fill}
              />
            </g>
          );
        }
        const band = width / n;
        const barW = band * (1 - gap);
        const x = i * band + (band - barW) / 2;
        const h = frac * height;
        return (
          <g key={i}>
            {trackColor && (
              <rect
                x={x}
                y={0}
                width={barW}
                height={height}
                rx={radius}
                fill={trackColor}
              />
            )}
            <rect
              x={x}
              y={height - h}
              width={barW}
              height={Math.max(h, 0.5)}
              rx={radius}
              fill={fill}
            />
          </g>
        );
      })}
    </svg>
  );
};

export default BarChart;
