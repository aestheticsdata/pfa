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
  /** Minimum rendered size (viewBox units) of a non-zero bar, so a tiny value
   *  stays visible among fine bars. Zero-value bars render nothing. */
  minBarSize?: number;
  /**
   * Stable id prefix; when set with `gradient`, bars fill with a vertical
   * gradient. Must be unique per mounted chart and deterministic (avoids
   * hydration mismatch — do NOT pass a random value).
   */
  id?: string;
  /** [baseline, tip] colors of the vertical gradient used as the default fill. */
  gradient?: [string, string];
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
  minBarSize = 0.5,
  id,
  gradient,
  className,
  ariaLabel,
}: BarChartProps) => {
  const domainMax = max ?? Math.max(1, ...bars.map((b) => b.value));
  const n = Math.max(1, bars.length);
  const defaultFill = id && gradient ? `url(#${id}-g)` : color;

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
      {id && gradient && (
        <defs>
          <linearGradient
            id={`${id}-g`}
            x1="0"
            y1="1"
            x2="0"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor={gradient[0]}
            />
            <stop
              offset="100%"
              stopColor={gradient[1]}
            />
          </linearGradient>
        </defs>
      )}

      {bars.map((b, i) => {
        const frac = Math.max(0, b.value) / domainMax;
        const fill = b.color ?? defaultFill;
        if (orientation === "horizontal") {
          const band = height / n;
          const barH = band * (1 - gap);
          const y = i * band + (band - barH) / 2;
          const w = frac * width;
          return (
            <g key={b.label}>
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
              {b.value > 0 && (
                <rect
                  x={0}
                  y={y}
                  width={Math.max(w, minBarSize)}
                  height={barH}
                  rx={radius}
                  fill={fill}
                />
              )}
            </g>
          );
        }
        const band = width / n;
        const barW = band * (1 - gap);
        const x = i * band + (band - barW) / 2;
        const h = frac * height;
        return (
          <g key={b.label}>
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
            {b.value > 0 && (
              <rect
                x={x}
                y={height - Math.max(h, minBarSize)}
                width={barW}
                height={Math.max(h, minBarSize)}
                rx={radius}
                fill={fill}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default BarChart;
