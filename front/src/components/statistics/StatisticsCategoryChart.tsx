"use client";

import { CardTitle } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { monthShortLabels, niceCeil } from "@components/statistics/helpers/statisticsData";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import useElementWidth from "@lib/dataviz/useElementWidth";
import useTweenTo from "@lib/dataviz/useTweenTo";

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
/** The compare year's bar: same hue as its category, dimmed. */
const COMPARE_OPACITY = 0.45;
/** Air between a year and its compare bar once the pair is fully open, in px. */
const PAIR_GAP = 2;
/** The pair opens and closes, and the Y scale glides, over this long. */
const COMPARE_ANIM_MS = 420;
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

  const plotted = (monthly: number[]) => range(months).map((m) => monthly[m] ?? 0);
  // Same months on both years — the compare bars answer "and last year, over this
  // very period?", so a compare year with no spend on a category draws nothing.
  // Deliberately blind to the toggle: every compare element stays mounted as long as
  // the data exists, so it can animate both ways and, above all, so the card's height
  // never depends on the toggle — a legend line appearing there shoves the whole
  // page down (PFA-163). `showCompare` is the one that follows the switch.
  const hasCompareData = series.some((s) => plotted(s.compareMonthly).some((value) => value > 0));
  const showCompare = compareEnabled && hasCompareData;
  const dataMax = Math.max(
    1,
    ...series.flatMap((s) => plotted(s.monthly)),
    ...(showCompare ? series.flatMap((s) => plotted(s.compareMonthly)) : []),
  );
  const yMax = niceCeil(dataMax);

  // Two tweens carry every bit of motion in this chart, in JS rather than CSS: SVG
  // geometry only transitions where the browser exposes `y`/`height` to CSS, and a
  // reduced-motion rule kills it outright — which left the toggle looking dead (PFA-165).
  // `reveal` opens and closes the year/compare-year pair; `scaleMax` glides the whole
  // plot when taking last year in changes the ceiling.
  const reveal = useTweenTo(showCompare ? 1 : 0, COMPARE_ANIM_MS);
  const scaleMax = useTweenTo(yMax, COMPARE_ANIM_MS);

  const plotW = Math.max(0, width - PAD_L - PAD_R);
  const slotW = plotW / months;
  const groupW = slotW * 0.62;
  const n = series.length;
  const gap = n > 1 ? 7 : 0;
  /** Width one category owns in a month's group, whether it shows one year or two. */
  const catW = n > 0 ? (groupW - gap * (n - 1)) / n : 0;
  // Turning the comparison on splits that slot in two, side by side — never one bar
  // behind the other, where every month this year outspent last year would hide it
  // and the growth would happen out of sight (PFA-165). Both halves are driven by
  // `reveal`, so the toggle *is* a resize: this year's bar narrows to make room while
  // last year's rises out of the baseline, and the reverse on the way out.
  const pairW = Math.max(0, (catW - PAIR_GAP) / 2);
  const barW = catW + (pairW - catW) * reveal;
  const compareW = pairW * reveal;
  const compareGap = PAIR_GAP * reveal;
  const labelFont = n >= 3 ? 8 : 9.5;

  /** Cumulated spend over the plotted months — Jan → current month, or the full year for a past one. */
  const plottedTotal = (monthly: number[]) => plotted(monthly).reduce((sum, value) => sum + value, 0);

  const cx = (m: number) => PAD_L + slotW * (m + 0.5);
  const yFor = (v: number) => Y0 - (Math.max(0, v) / scaleMax) * PLOT_H;

  // Gridlines never move; only the figures on them do, so they follow the tween and
  // count to the new ceiling with the bars.
  const gridRows = range(5).map((i) => ({
    y: Y0 - (i * PLOT_H) / 4,
    value: (scaleMax * i) / 4,
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
                  // Solid chip, dimmed chip: the legend swatch is the pair of bars in
                  // miniature, so nothing else has to explain which year is which.
                  <span className="inline-flex items-center gap-0.5">
                    <i
                      className="inline-block size-2.5 rounded-xs"
                      style={{ background: s.color }}
                    />
                    {hasCompareData && (
                      <i
                        className="inline-block size-2.5 rounded-xs transition-opacity duration-300 ease-out"
                        style={{ background: s.color, opacity: showCompare ? COMPARE_OPACITY : 0 }}
                      />
                    )}
                  </span>
                }
              >
                {s.name}
              </LegendItem>
              <span className="num text-ink-2">{euro0(plottedTotal(s.monthly))} €</span>
              {hasCompareData && (
                <span
                  className="num text-ink-4 transition-opacity duration-300 ease-out"
                  style={{ opacity: showCompare ? 1 : 0 }}
                  aria-hidden={!showCompare}
                >
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
              // Keyed by its gridline, which never moves: the figure on it changes on
              // every frame of a rescale.
              <g key={`grid-${row.y}`}>
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

            {/* grouped bars — one slot per category, split into this year and last
                year as the comparison opens */}
            {range(months).map((m) => {
              const gx = cx(m) - groupW / 2;
              return (
                <g key={`m-${m}`}>
                  {series.map((s, i) => {
                    const v = s.monthly[m] ?? 0;
                    const cv = hasCompareData ? (s.compareMonthly[m] ?? 0) : 0;
                    const slotX = gx + i * (catW + gap);
                    const by = yFor(v);
                    const compareH = (Y0 - yFor(cv)) * reveal;
                    return (
                      <g key={s.name}>
                        {v > 0 && (
                          <rect
                            x={slotX}
                            y={by}
                            width={barW}
                            height={Y0 - by}
                            rx={3}
                            fill={s.color}
                            opacity={0.9}
                          />
                        )}
                        {cv > 0 && compareW > 0.5 && compareH > 0.5 && (
                          <rect
                            x={slotX + barW + compareGap}
                            y={Y0 - compareH}
                            width={compareW}
                            height={compareH}
                            rx={3}
                            fill={s.color}
                            opacity={COMPARE_OPACITY}
                          />
                        )}
                        {/* Centred on its own bar, so it travels with it as the bar
                            narrows, and never drifts over last year's. */}
                        {v > 0 && (
                          <text
                            x={slotX + barW / 2}
                            y={by - 6}
                            className="num"
                            fontSize={labelFont}
                            textAnchor="middle"
                            fill="var(--ink-2)"
                          >
                            {euro0(v)}
                          </text>
                        )}
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
