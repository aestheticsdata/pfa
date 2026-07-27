"use client";

import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { areaPath, linePath } from "@lib/dataviz/linePaths";
import { linearScale } from "@lib/dataviz/scales";

interface StatMiniChartProps {
  /** Stable, unique gradient id. */
  id: string;
  /** Full 12-month series; only the first `count` points are plotted. */
  values: number[];
  count: number;
  /** Draws a dashed horizontal reference line + "avg." label at this value. */
  average?: number;
  height?: number;
}

/** Round up to a "nice" axis ceiling (1, 1.5, 2, 3, 4, 5, 7.5, 10 × 10ⁿ). */
const niceCeil = (value: number): number => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 1.5, 2, 3, 4, 5, 7.5, 10];
  const normalized = value / magnitude;
  const step = steps.find((s) => s >= normalized) ?? 10;
  return step * magnitude;
};

const W = 300;
const PAD = { top: 12, right: 8, bottom: 12, left: 8 };

/** Default plot height — also what a KPI card reserves while its data loads. */
export const MINI_CHART_HEIGHT = 150;

/**
 * The KPI sparkline, shared by every stat card so they render identically:
 * a gradient area fill with solid x/y axes and a dashed grid (accent-green
 * verticals per the mockup) drawn ON TOP of the fill, an end-of-line dot, an
 * optional dashed average line, and an HTML y-axis graduation (SVG text would be
 * distorted by the stretched viewBox — the end dot is HTML for the same reason).
 *
 * The plot draws itself left→right on mount; give the component a `key` that
 * changes with the series to replay that draw.
 */
const StatMiniChart = ({ id, values, count, average, height = MINI_CHART_HEIGHT }: StatMiniChartProps) => {
  const { numberLocale } = useFormat();
  const statistics = useTranslations("statistics");

  const kFormat = (value: number): string =>
    value >= 1000
      ? `${(value / 1000).toLocaleString(numberLocale, { maximumFractionDigits: 1 })}k`
      : `${Math.round(value)}`;

  const points = values.slice(0, count).map((y, x) => ({ x, y }));
  if (points.length < 2) return <div style={{ height }} />;

  const dataMax = Math.max(...points.map((p) => p.y), average ?? 0, 1);
  const max = niceCeil(dataMax);

  const sx = linearScale(0, Math.max(1, count - 1), PAD.left, W - PAD.right);
  const sy = linearScale(0, max, height - PAD.bottom, PAD.top);
  const pixels = points.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
  const baseY = sy(0);

  const hGrid = [max, max / 2]; // 0 is the x-axis itself
  // 4 evenly-spaced verticals (like the mockup); the last sits on the right edge,
  // under the end dot (the y-axis is the left edge)
  const innerW = W - PAD.left - PAD.right;
  const V_LINES = 4;
  const vGrid = Array.from({ length: V_LINES }, (_, i) => PAD.left + (innerW * (i + 1)) / V_LINES);

  const last = pixels[pixels.length - 1];
  const dotLeft = (last.x / W) * 100;
  const dotTop = (last.y / height) * 100;
  const avgY = average != null ? sy(average) : null;
  const avgTop = avgY != null ? (avgY / height) * 100 : 0;

  return (
    <div
      className="flex gap-2.5"
      style={{ height }}
    >
      <div
        className="num flex flex-col justify-between text-2xs leading-none text-ink-4"
        style={{ paddingTop: PAD.top - 6, paddingBottom: PAD.bottom - 6 }}
      >
        <span>{kFormat(max)}</span>
        <span>{kFormat(max / 2)}</span>
        <span>0</span>
      </div>
      <div
        className="relative min-w-0 flex-1"
        role="img"
        aria-label={statistics.miniChart.ariaLabel}
      >
        {/* Three stacked layers, because only the series may animate while the
            grid, the axes and the average line stay put — and the grid has to sit
            between the gradient fill and the line. All three are absolute, so
            paint order is DOM order and no z-index is needed.
            1) gradient area — revealed left→right on mount. */}
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          className="pfa-anim-draw-x absolute inset-0 block size-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`${id}-fill`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--accent-strong)"
                stopOpacity="0.28"
              />
              <stop
                offset="100%"
                stopColor="var(--accent-strong)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <path
            d={areaPath(pixels, baseY)}
            fill={`url(#${id}-fill)`}
            stroke="none"
          />
        </svg>

        {/* 2) static chrome, never animated */}
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 block size-full"
          aria-hidden="true"
        >
          {/* dashed grid — drawn over the fill so it stays visible */}
          {hGrid.map((v) => (
            <line
              key={`h-${v}`}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--ink-4)"
              strokeWidth={1}
              strokeOpacity={0.45}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {vGrid.map((x) => (
            <line
              key={`v-${x}`}
              x1={x}
              x2={x}
              y1={PAD.top}
              y2={baseY}
              stroke="var(--accent-strong)"
              strokeWidth={1}
              strokeOpacity={0.4}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* average reference line */}
          {avgY != null && (
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={avgY}
              y2={avgY}
              stroke="var(--ink-3)"
              strokeWidth={1.25}
              strokeOpacity={0.85}
              strokeDasharray="5 3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* solid axes */}
          <line
            x1={PAD.left}
            x2={PAD.left}
            y1={PAD.top}
            y2={baseY}
            stroke="var(--ink-4)"
            strokeWidth={1}
            strokeOpacity={0.7}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={baseY}
            y2={baseY}
            stroke="var(--ink-4)"
            strokeWidth={1}
            strokeOpacity={0.7}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* 3) the series line and its end dot, revealed by a second clip that
            starts with the area's — same class, same frame, so they stay in step. */}
        <div className="pfa-anim-draw-x absolute inset-0">
          <svg
            viewBox={`0 0 ${W} ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 block size-full"
            aria-hidden="true"
          >
            <path
              d={linePath(pixels)}
              fill="none"
              stroke="var(--accent-strong)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* end dot — filled; HTML so it stays perfectly round under the stretched viewBox */}
          <span
            className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-strong"
            style={{ left: `${dotLeft}%`, top: `${dotTop}%` }}
          />
        </div>

        {avgY != null && (
          <span
            className="num pointer-events-none absolute right-6 text-3xs text-ink-4"
            style={{ top: `calc(${avgTop}% - 14px)` }}
          >
            {statistics.miniChart.averageShort}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatMiniChart;
