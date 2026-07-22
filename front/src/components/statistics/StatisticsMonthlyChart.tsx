"use client";

import { CardTitle } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { filledMonthlyIncome, monthShortLabels, niceCeil } from "@components/statistics/helpers/statisticsData";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import useElementWidth from "@lib/dataviz/useElementWidth";

interface StatisticsMonthlyChartProps {
  year: number;
  compareYear: number;
  /** 12-slot Jan→Dec regular spend for `year`. */
  regularMonthly: number[];
  /** 12-slot Jan→Dec exceptional spend for `year`. */
  exceptionalMonthly: number[];
  /** 12-slot Jan→Dec total spend for `compareYear`. */
  compareMonthly: number[];
  /** 12-slot Jan→Dec monthly income (dashboard initialAmount); null where the
   *  user has no dashboard row. Drawn as a stepped "monthly budget" line. */
  monthlyIncome: (number | null)[];
  /** Projected regular remainder of the in-progress month (chain N-1 → N-2 →
   *  M-1), or null when there's no reference. Added to the realized total. */
  projectedRemainder: number | null;
  compareEnabled: boolean;
  showExceptionals: boolean;
  now: Date;
}

const H = 340;
const GRID_TOP = 40;
const Y0 = 280; // baseline (value 0)
const PLOT_H = Y0 - GRID_TOP; // 240
const PAD_L = 48;
const PAD_R = 14;
const X_LABEL_Y = 304;
const PLACEHOLDER_H = 120;
const BAR_MAX_W = 46;
const EXC_INK = "oklch(0.22 0.04 240)"; // dark ink for the number on a blue cap

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** A dashed line swatch for the legend (2026 compare / budget). */
const DashSwatch = ({ color, opacity = 1 }: { color: string; opacity?: number }) => (
  <span
    className="inline-block h-0.5 w-4 align-middle"
    style={{
      opacity,
      backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`,
    }}
  />
);

/** "Monthly spendings" — 2026 bars with exceptional caps, the compare-year
 *  dashed line, the flat budget reference and the current-month projection. */
const StatisticsMonthlyChart = ({
  year,
  compareYear,
  regularMonthly,
  exceptionalMonthly,
  compareMonthly,
  monthlyIncome,
  projectedRemainder,
  compareEnabled,
  showExceptionals,
  now,
}: StatisticsMonthlyChartProps) => {
  const { euro0 } = useFormat();
  const statistics = useTranslations("statistics");
  const dateLocale = useDateLocale();
  const monthLabels = monthShortLabels(dateLocale);
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const { monthlyChart } = statistics;

  const cm = now.getMonth();
  const isCurrentYear = year === now.getFullYear();
  const realizedCount = year > now.getFullYear() ? 0 : isCurrentYear ? cm + 1 : 12;

  const exc = regularMonthly.map((_, i) => (showExceptionals ? (exceptionalMonthly[i] ?? 0) : 0));
  const total = regularMonthly.map((v, i) => v + exc[i]);

  // current-month end-of-month projection: realized so far + the regular
  // remainder estimated from history (chain N-1 → N-2 → M-1), exceptionals not
  // extrapolated. A null remainder = the user's first month of data → no
  // projection.
  const realizedCM = total[cm] ?? 0;
  const projectedCM = realizedCM + (projectedRemainder ?? 0);
  const hasProjection = isCurrentYear && realizedCount > 0 && projectedRemainder !== null && projectedRemainder > 1;

  const budgetSeries = filledMonthlyIncome(monthlyIncome);

  const scaleValues = [
    ...range(realizedCount).map((m) => total[m]),
    ...(compareEnabled ? compareMonthly : []),
    ...(budgetSeries ?? []),
    ...(hasProjection ? [projectedCM] : []),
    1,
  ];
  const yMax = niceCeil(Math.max(...scaleValues));

  const innerW = Math.max(0, width - PAD_L - PAD_R);
  const slotW = innerW / 12;
  const cx = (m: number) => PAD_L + slotW * (m + 0.5);
  const barW = Math.min(BAR_MAX_W, slotW * 0.5);
  const yFor = (v: number) => Y0 - (Math.max(0, v) / yMax) * PLOT_H;

  const gridRows = range(5).map((i) => ({
    y: GRID_TOP + (i * PLOT_H) / 4,
    value: (yMax * (4 - i)) / 4,
  }));

  // Stepped budget line: one horizontal segment per month at that month's income,
  // stepping vertically where income changes (income assumed constant within a
  // month). Spans the full plot width like the old flat line.
  const budgetStepPath = budgetSeries
    ? range(12)
        .map((m) => {
          const y = yFor(budgetSeries[m]);
          return `${m === 0 ? "M" : "L"} ${PAD_L + slotW * m} ${y} L ${PAD_L + slotW * (m + 1)} ${y}`;
        })
        .join(" ")
    : null;
  const showCompare = compareEnabled && compareMonthly.some((v) => v > 0);
  const comparePath = range(12)
    .map((m) => `${m === 0 ? "M" : "L"} ${cx(m)} ${yFor(compareMonthly[m])}`)
    .join(" ");

  const subtitle = compareEnabled
    ? monthlyChart.subtitleCompare(year, compareYear)
    : isCurrentYear
      ? statistics.ytdSubtitle(year, monthLabels[cm])
      : `${year}`;

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <CardTitle>{monthlyChart.title}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-4">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4.5 text-xs text-ink-3">
          <LegendItem swatch={<i className="inline-block size-2.5 rounded-xs bg-accent-strong" />}>{year}</LegendItem>
          {showExceptionals && (
            <LegendItem swatch={<i className="inline-block size-2.5 rounded-xs bg-exc" />}>
              {monthlyChart.legendExceptional}
            </LegendItem>
          )}
          {compareEnabled && (
            <LegendItem
              swatch={
                <DashSwatch
                  color="var(--accent-strong)"
                  opacity={0.85}
                />
              }
            >
              {compareYear}
            </LegendItem>
          )}
          <LegendItem swatch={<DashSwatch color="var(--ink-3)" />}>{monthlyChart.legendBudget}</LegendItem>
        </div>
      </div>

      <div
        ref={ref}
        className="mt-4.5 w-full"
      >
        {width > 0 && (
          <svg
            viewBox={`0 0 ${width} ${H}`}
            width={width}
            height={H}
            className="block"
            role="img"
            aria-label={monthlyChart.ariaLabel(year)}
          >
            <defs>
              <pattern
                id="stat-proj-hatch"
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect
                  width="5"
                  height="5"
                  fill="var(--accent-strong)"
                  opacity="0.08"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="5"
                  stroke="var(--accent-strong)"
                  strokeWidth="1.4"
                  opacity="0.3"
                />
              </pattern>
            </defs>

            {/* grid + y labels */}
            {gridRows.map((row) => (
              <g key={`grid-${row.value}`}>
                <line
                  x1={PAD_L}
                  x2={width - PAD_R}
                  y1={row.y}
                  y2={row.y}
                  stroke="var(--line-soft)"
                  strokeWidth={1}
                />
                <text
                  x={PAD_L - 12}
                  y={row.y + 3}
                  fontSize={10}
                  textAnchor="end"
                  fill="var(--ink-4)"
                  className="num"
                >
                  {euro0(row.value)}
                </text>
              </g>
            ))}

            {/* monthly budget (per-month stepped reference) */}
            {budgetSeries && (
              <>
                <path
                  d={budgetStepPath ?? ""}
                  fill="none"
                  stroke="var(--ink-3)"
                  strokeWidth={1}
                  strokeDasharray="3 5"
                />
                <text
                  x={width - PAD_R}
                  y={yFor(budgetSeries[11]) - 6}
                  fontSize={10}
                  textAnchor="end"
                  fill="var(--ink-3)"
                  className="num"
                >
                  {monthlyChart.budgetLine}
                </text>
              </>
            )}

            {/* compare-year line + dots */}
            {showCompare && (
              <g>
                <path
                  d={comparePath}
                  fill="none"
                  stroke="var(--accent-strong)"
                  strokeWidth={1.5}
                  strokeDasharray="3 4"
                  opacity={0.45}
                />
                {range(12).map((m) => (
                  <circle
                    key={`cmp-${m}`}
                    cx={cx(m)}
                    cy={yFor(compareMonthly[m])}
                    r={2.2}
                    fill="var(--accent-strong)"
                    opacity={0.45}
                  />
                ))}
              </g>
            )}

            {/* 2026 bars + exceptional caps + value labels */}
            {range(realizedCount).map((m) => {
              const t = total[m];
              if (t <= 0) return null;
              const barTop = yFor(t);
              const regTop = yFor(regularMonthly[m]);
              const capH = regTop - barTop;
              const hasCap = showExceptionals && exc[m] > 0 && capH > 0;
              const isCurrentMonth = isCurrentYear && m === cm;
              return (
                <g key={`bar-${m}`}>
                  <rect
                    x={cx(m) - barW / 2}
                    y={barTop}
                    width={barW}
                    height={Y0 - barTop}
                    rx={3}
                    fill="var(--accent-strong)"
                    opacity={0.85}
                  />
                  {hasCap && (
                    <>
                      <rect
                        x={cx(m) - barW / 2}
                        y={barTop}
                        width={barW}
                        height={capH}
                        rx={3}
                        fill="var(--exc)"
                      />
                      <rect
                        x={cx(m) - barW / 2}
                        y={regTop - 1.5}
                        width={barW}
                        height={3}
                        fill="var(--surface-elev)"
                      />
                      {capH >= 13 && (
                        <text
                          x={cx(m)}
                          y={barTop + capH / 2 + 3}
                          fontSize={8.5}
                          fontWeight={600}
                          textAnchor="middle"
                          fill={EXC_INK}
                          className="num"
                        >
                          {euro0(exc[m])}
                        </text>
                      )}
                    </>
                  )}
                  {isCurrentMonth && hasProjection ? (
                    <text
                      x={cx(m) + barW / 2 + 6}
                      y={barTop + 3}
                      fontSize={10}
                      textAnchor="start"
                      fill="var(--ink-2)"
                      className="num"
                    >
                      {euro0(t)} €
                    </text>
                  ) : (
                    <text
                      x={cx(m)}
                      y={barTop - 8}
                      fontSize={10}
                      textAnchor="middle"
                      fill="var(--ink-2)"
                      className="num"
                    >
                      {euro0(t)} €
                    </text>
                  )}
                </g>
              );
            })}

            {/* current-month projection (realized + history-based remainder) */}
            {hasProjection && (
              <g>
                <rect
                  x={cx(cm) - barW / 2}
                  y={yFor(projectedCM)}
                  width={barW}
                  height={yFor(realizedCM) - yFor(projectedCM)}
                  fill="url(#stat-proj-hatch)"
                />
                <line
                  x1={cx(cm) - barW / 2 - 1}
                  x2={cx(cm) + barW / 2 + 1}
                  y1={yFor(projectedCM)}
                  y2={yFor(projectedCM)}
                  stroke="var(--accent-strong)"
                  strokeWidth={1.5}
                />
                <line
                  x1={cx(cm)}
                  x2={cx(cm)}
                  y1={yFor(projectedCM) - 1}
                  y2={yFor(projectedCM) - 13}
                  stroke="var(--accent-strong)"
                  strokeWidth={1}
                  opacity={0.5}
                />
                <text
                  x={cx(cm)}
                  y={yFor(projectedCM) - 18}
                  fontSize={10}
                  textAnchor="middle"
                  fill="var(--ink-3)"
                  className="num"
                >
                  {monthlyChart.projection(euro0(projectedCM))}
                </text>
              </g>
            )}

            {/* future placeholders */}
            {range(12)
              .filter((m) => m >= realizedCount)
              .map((m) => (
                <rect
                  key={`ph-${m}`}
                  x={cx(m) - barW / 2}
                  y={Y0 - PLACEHOLDER_H}
                  width={barW}
                  height={PLACEHOLDER_H}
                  rx={3}
                  fill="none"
                  stroke="var(--line)"
                  strokeDasharray="2 3"
                />
              ))}

            {/* x labels */}
            {monthLabels.map((label, m) => (
              <text
                key={label}
                x={cx(m)}
                y={X_LABEL_Y}
                fontSize={11}
                textAnchor="middle"
                fill={isCurrentYear && m === cm ? "var(--ink)" : "var(--ink-3)"}
              >
                {label}
              </text>
            ))}
          </svg>
        )}
      </div>
    </GlowCard>
  );
};

export default StatisticsMonthlyChart;
