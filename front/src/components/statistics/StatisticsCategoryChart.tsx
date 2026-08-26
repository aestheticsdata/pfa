"use client";

import { CardTitle } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { monthShortLabels, niceCeil } from "@components/statistics/helpers/statisticsData";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import useElementWidth from "@lib/dataviz/useElementWidth";

import type { CategorySeries } from "@components/statistics/interfaces/statisticsCategoryChartTypes";

interface StatisticsCategoryChartProps {
  year: number;
  series: CategorySeries[];
  /** Number of leading months to plot (elapsed months for the current year). */
  monthsCount: number;
  compareYear: number;
  compareEnabled: boolean;
  now: Date;
}

const H = 340;
const PAD_T = 28;
const PAD_B = 54;
const PAD_L = 52;
const PAD_R = 16;
/** Compare-year ghost bars: same hue as their category, faded back behind it. */
const GHOST_OPACITY = 0.25;
/** Half the width a ghost bar gains over the bar it sits behind, in px. */
const GHOST_BLEED = 2.5;
const Y0 = H - PAD_B; // 286
const PLOT_H = Y0 - PAD_T; // 258

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** "Monthly spendings by category" — grouped bars, one group per month and
 *  one bar per selected category. All data is real (from /statistics). */
const StatisticsCategoryChart = ({
  year,
  series,
  monthsCount,
  compareYear,
  compareEnabled,
  now,
}: StatisticsCategoryChartProps) => {
  const { euro0 } = useFormat();
  const statistics = useTranslations("statistics");
  const dateLocale = useDateLocale();
  const monthLabels = monthShortLabels(dateLocale);
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const months = Math.max(1, monthsCount);
  const isCurrentYear = year === now.getFullYear();
  const cm = now.getMonth();

  // Same months on both years — the ghosts answer "and last year, over this very
  // period?", so a compare year with no spend on any selected category draws nothing.
  const showCompare = compareEnabled && series.some((s) => range(months).some((m) => (s.compareMonthly[m] ?? 0) > 0));

  const plotted = (monthly: number[]) => range(months).map((m) => monthly[m] ?? 0);
  const dataMax = Math.max(
    1,
    ...series.flatMap((s) => plotted(s.monthly)),
    ...(showCompare ? series.flatMap((s) => plotted(s.compareMonthly)) : []),
  );
  const yMax = niceCeil(dataMax);

  const plotW = Math.max(0, width - PAD_L - PAD_R);
  const slotW = plotW / months;
  const groupW = slotW * 0.62;
  const n = series.length;
  const gap = n > 1 ? 7 : 0;
  const barW = n > 0 ? (groupW - gap * (n - 1)) / n : 0;
  // The ghost overflows its bar on both sides so it stays readable when last year
  // was the smaller of the two — capped to keep 2px of air between neighbouring ghosts.
  const ghostBleed = n > 1 ? Math.max(0, Math.min(GHOST_BLEED, (gap - 2) / 2)) : GHOST_BLEED;
  const ghostW = barW + ghostBleed * 2;
  const labelFont = n >= 3 ? 8 : 9.5;

  /** Cumulated spend over the plotted months — Jan → current month, or the full year for a past one. */
  const plottedTotal = (monthly: number[]) => plotted(monthly).reduce((sum, value) => sum + value, 0);

  const cx = (m: number) => PAD_L + slotW * (m + 0.5);
  const yFor = (v: number) => Y0 - (Math.max(0, v) / yMax) * PLOT_H;

  const gridRows = range(5).map((i) => ({
    y: Y0 - (i * PLOT_H) / 4,
    value: (yMax * i) / 4,
  }));

  const period = isCurrentYear ? statistics.ytdSubtitle(year, monthLabels[months - 1]) : `${year}`;
  const subtitle = showCompare ? statistics.categoryChart.subtitleCompare(period, compareYear) : period;

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <CardTitle>{statistics.categoryChart.title}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-4">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-start gap-4.5 text-xs text-ink-3">
          {series.map((s) => (
            <div
              key={s.name}
              className="flex flex-col items-end gap-1"
            >
              <LegendItem
                className="capitalize"
                swatch={
                  // Solid chip + faded chip, in that order: the legend swatch mirrors
                  // the bar and the ghost behind it, so nothing else has to explain them.
                  <span className="inline-flex items-center gap-0.5">
                    <i
                      className="inline-block size-2.5 rounded-xs"
                      style={{ background: s.color }}
                    />
                    {showCompare && (
                      <i
                        className="inline-block size-2.5 rounded-xs"
                        style={{ background: s.color, opacity: GHOST_OPACITY }}
                      />
                    )}
                  </span>
                }
              >
                {s.name}
              </LegendItem>
              <span className="num text-ink-2">{euro0(plottedTotal(s.monthly))} €</span>
              {showCompare && (
                <span className="num text-ink-4">
                  {statistics.categoryChart.compareTotal(compareYear, euro0(plottedTotal(s.compareMonthly)))}
                </span>
              )}
            </div>
          ))}
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
            aria-label={
              showCompare
                ? statistics.categoryChart.ariaLabelCompare(year, compareYear)
                : statistics.categoryChart.ariaLabel(year)
            }
          >
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

            {/* grouped bars — every ghost of the group first, so a wide ghost never
                bleeds over the solid bar of the next category */}
            {range(months).map((m) => {
              const gx = cx(m) - groupW / 2;
              return (
                <g key={`m-${m}`}>
                  {showCompare &&
                    series.map((s, i) => {
                      const cv = s.compareMonthly[m] ?? 0;
                      if (cv <= 0) return null;
                      const gy = yFor(cv);
                      return (
                        <rect
                          key={`ghost-${s.name}`}
                          x={gx + i * (barW + gap) - ghostBleed}
                          y={gy}
                          width={ghostW}
                          height={Y0 - gy}
                          rx={3}
                          fill={s.color}
                          opacity={GHOST_OPACITY}
                        />
                      );
                    })}
                  {series.map((s, i) => {
                    const v = s.monthly[m] ?? 0;
                    if (v <= 0) return null;
                    const bx = gx + i * (barW + gap);
                    const by = yFor(v);
                    const cv = showCompare ? (s.compareMonthly[m] ?? 0) : 0;
                    // The single label sits above whichever of the two bars is taller,
                    // rather than landing inside a ghost that overshoots this year.
                    const labelY = Math.min(by, cv > 0 ? yFor(cv) : by) - 6;
                    return (
                      <g key={s.name}>
                        <rect
                          x={bx}
                          y={by}
                          width={barW}
                          height={Y0 - by}
                          rx={3}
                          fill={s.color}
                          opacity={0.9}
                        />
                        <text
                          x={bx + barW / 2}
                          y={labelY}
                          fontSize={labelFont}
                          textAnchor="middle"
                          fill="var(--ink-2)"
                          className="num"
                        >
                          {euro0(v)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* x labels */}
            {range(months).map((m) => (
              <text
                key={`x-${m}`}
                x={cx(m)}
                y={Y0 + 20}
                fontSize={11}
                textAnchor="middle"
                fill={isCurrentYear && m === cm ? "var(--ink)" : "var(--ink-3)"}
              >
                {monthLabels[m]}
              </text>
            ))}
          </svg>
        )}
      </div>
    </GlowCard>
  );
};

export default StatisticsCategoryChart;
