"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { MeterBar } from "@components/shared/MeterBar";
import overspendLevel, {
  OVERSPEND_DANGER_RATIO,
  overspendTextClass,
} from "@components/spendings/helpers/overspendLevel";
import { scaleFrac } from "@components/statistics/helpers/weekdayBullet";
import { overallDailyAverage, weekdayAverages, weekdayInsights } from "@components/statistics/helpers/weekdayStats";
import WeekdayBulletBar from "@components/statistics/WeekdayBulletBar";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { AnimatedNumber, CursorTooltip, useCursorHover } from "@lib/dataviz";
import { useEffect, useState } from "react";

import type { DailyStat, WeekdayCategory } from "@src/schemas/stats";
import type { ReactNode } from "react";

// Row layout: fixed day-name and amount columns around the elastic bar column.
const GRID_COLS = "grid grid-cols-[92px_1fr_152px] gap-3";
const ROW_GRID = `${GRID_COLS} items-center`;

// Bar-column geometry, mirrored by the full-height overlays (the average line) so
// they span the plot and line up with the bars. Must match GRID_COLS: a 92px
// day-name column and a 152px amount column, each separated from the elastic bar
// column by gap-3 (12px).
const DAY_COL_PX = 92;
const AMOUNT_COL_PX = 152;
const COL_GAP_PX = 12;

// Fixed-scale headroom so the top marker (2×budget, or the widest whisker) always
// sits inside the plot with a little air past it (COS-132, COS-127).
const SCALE_HEADROOM = 1.12;

// Compare-year bar + swatch fill: the darker accent green with a light diagonal
// hatch — the same muted-green hatch idiom as the forecast strip, distinct from
// the bright main-bar gradient. Echoes the monthly chart's "comparison" visual
// language (COS-127).
const COMPARE_FILL =
  "repeating-linear-gradient(45deg, var(--accent-d) 0 3px, color-mix(in oklch, var(--accent-d) 55%, var(--accent-strong)) 3px 6px)";

// Legend colour-band swatch fills, matching the bullet-bar zones.
const BAND_FILL = { under: "var(--bar-fill)", between: "var(--warn)", over: "var(--neg)" } as const;

// Enter/exit duration (ms) for the compare-year marks collapsing + fading in and
// out when "Compare to" is toggled.
const COMPARE_ANIM_MS = 280;

interface StatisticsDayOfWeekProps {
  year: number;
  now: Date;
  /** Per-day spending totals for the year (COS-45); `undefined` while the request is in flight. */
  days: DailyStat[] | undefined;
  /** Compare-year daily totals; `undefined` when "Compare to" is off (COS-127). */
  compareDays?: DailyStat[];
  /** The year being compared against, shown on each compare row + the legend. */
  compareYear: number;
  /** Whether year comparison is active — gates the compare-year legend item. */
  compareEnabled: boolean;
  /** Dominant category per weekday (index 0 = Monday), for the tooltip; `undefined` while loading. */
  weekdayCategories?: (WeekdayCategory | null)[];
  /** Weekly ceiling (real data) — its per-day share drives the colour zones. */
  weeklyCeiling: number | null;
}

/** Signed % of `value` relative to `base` (spent-more is positive), or null when there is no base. */
const deltaPct = (value: number, base: number): number | null => (base > 0 ? (value / base - 1) * 100 : null);

/** Year-over-year delta coloured by direction: spending up = worse (red), down = better (green). */
const DeltaBadge = ({ pct }: { pct: number }) => {
  const { dayOfWeek } = useTranslations("statistics");

  const up = pct >= 0;
  return (
    <span className={up ? "text-neg" : "text-accent-strong"}>
      {up ? "↑" : "↓"} {dayOfWeek.deltaPct(String(Math.abs(Math.round(pct))))}
    </span>
  );
};

/** Thin darker-green hatched bar for the compared year, on the shared fixed scale. */
const CompareBar = ({ frac, expanded }: { frac: number; expanded: boolean }) => (
  <span
    className="block h-2 rounded-sm"
    // Width (not scaleX) so the diagonal hatch reveals instead of stretching. Grows
    // from 0 on show; the collapse back to 0 is deferred until after the fade-out
    // (off-screen), so hiding never visibly changes the bar's length.
    style={{
      width: expanded ? `${frac * 100}%` : 0,
      background: COMPARE_FILL,
      transition: `width ${COMPARE_ANIM_MS}ms ease-out`,
    }}
  />
);

/** A dashed grey guide delimiting a colour zone, running the full height of the plot.
 *  1px to match the budget ticks at the bottom. */
const ThresholdGuide = ({ frac }: { frac: number }) => (
  <span
    className="absolute inset-y-0"
    style={{ left: `${frac * 100}%`, marginLeft: -0.5, borderLeft: "1px dashed var(--ink)", opacity: 0.6 }}
  />
);

/** min→max "range" whisker: a thin connector with end caps, over the main bar. */
const Whisker = ({ minFrac, maxFrac }: { minFrac: number; maxFrac: number }) => (
  <div
    className="pointer-events-none absolute inset-0"
    aria-hidden
  >
    <span
      className="absolute top-1/2 h-px -translate-y-1/2 bg-ink-2/45"
      style={{ left: `${minFrac * 100}%`, width: `${Math.max(0, maxFrac - minFrac) * 100}%` }}
    />
    <span
      className="absolute inset-y-1 w-px bg-ink-2/80"
      style={{ left: `${minFrac * 100}%` }}
    />
    <span
      className="absolute inset-y-1 w-px bg-ink-2/80"
      style={{ left: `${maxFrac * 100}%` }}
    />
  </div>
);

/** One header insight chip: a coloured dot + label. */
const Chip = ({ dot, children }: { dot: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-hi/60 px-2.5 py-1 text-2xs">
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ background: dot }}
    />
    {children}
  </span>
);

/** A swatch + label pair in the bottom legend. */
const LegendItem = ({ swatch, children }: { swatch: ReactNode; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5">
    {swatch}
    {children}
  </span>
);

/** One label/value line in the hover tooltip. */
const TipRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-6">
    <span className="text-ink-4">{label}</span>
    <span className="text-ink-2">{value}</span>
  </div>
);

/** "Spendings by day of the week" — real weekday spending rhythm (COS-48, COS-132, COS-127). */
const StatisticsDayOfWeek = ({
  year,
  now,
  days,
  compareDays,
  compareYear,
  compareEnabled,
  weekdayCategories,
  weeklyCeiling,
}: StatisticsDayOfWeekProps) => {
  const { euro, euro0, pct1 } = useFormat();
  const { dayOfWeek } = useTranslations("statistics");
  const common = useTranslations("common");
  const rowTip = useCursorHover<number>();

  // Compare-year marks: `hasCompareData` (the compared year has spending, and the
  // fetch keeps it cached even when the toggle is off) reserves their layout space,
  // so toggling "Compare to" only fades them in/out and the widget keeps its height.
  // `showCompare` (fade state) additionally requires the toggle to be on.
  const compareStats = compareDays ? weekdayAverages(compareDays, compareYear, now) : null;
  const hasCompareData = compareStats?.some((s) => s.avgAmount > 0) ?? false;
  const showCompare = compareEnabled && hasCompareData;

  // Compare bars grow from 0 on show; on hide they only fade — the width is held
  // through the fade, then reset to 0 off-screen, so hiding never shrinks the bar
  // and the next show grows again.
  const [barsCollapsed, setBarsCollapsed] = useState(true);
  useEffect(() => {
    if (showCompare) {
      setBarsCollapsed(false);
      return;
    }
    const timer = setTimeout(() => setBarsCollapsed(true), COMPARE_ANIM_MS);
    return () => clearTimeout(timer);
  }, [showCompare]);

  if (days === undefined) {
    return (
      <GlowCard
        as="section"
        className="px-6 py-5.5"
      >
        <CardSectionHeader
          title={dayOfWeek.title}
          meta={dayOfWeek.meta(year)}
        />
        <div className="grid place-items-center py-10 text-sm text-ink-4">{common.loading}</div>
      </GlowCard>
    );
  }

  const stats = weekdayAverages(days, year, now);
  const overall = overallDailyAverage(days, year, now);
  const { peakDow, troughDow, weekendDeltaPct } = weekdayInsights(stats);

  // Per-weekday budget = the weekly ceiling spread over 7 days (COS-34 rule).
  const dayBudget = weeklyCeiling != null && weeklyCeiling > 0 ? weeklyCeiling / 7 : null;

  // One euro scale shared by every mark — both years' averages, the selected
  // year's whisker maxes and the budget markers — so bars, whiskers, the average
  // line and the ticks are all directly comparable (COS-127).
  const rawMax = Math.max(
    ...stats.map((s) => s.avgAmount),
    ...stats.map((s) => s.max),
    ...(compareStats?.map((s) => s.avgAmount) ?? []),
    1,
  );
  const scaleMax =
    dayBudget != null ? Math.max(rawMax, dayBudget * OVERSPEND_DANGER_RATIO) * SCALE_HEADROOM : rawMax * SCALE_HEADROOM;

  const avgFrac = scaleFrac(overall.avgAmount, scaleMax);
  const hasInsights = peakDow != null;
  const dangerBudget = dayBudget != null ? dayBudget * OVERSPEND_DANGER_RATIO : null;

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <CardSectionHeader
        title={dayOfWeek.title}
        meta={
          <>
            <span className="font-semibold text-ink">{year}</span>{" "}
            {dayOfWeek.subtitle(pct1(overall.avgTx), euro(overall.avgAmount))}
          </>
        }
      />

      {hasInsights && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-ink-4">
          {peakDow != null && (
            <Chip dot="var(--neg)">
              {dayOfWeek.chips.peak}{" "}
              <span className="num text-neg">
                {dayOfWeek.chips.dayAmount(dayOfWeek.days[peakDow].toLowerCase(), euro0(stats[peakDow].avgAmount))}
              </span>
            </Chip>
          )}
          {troughDow != null && troughDow !== peakDow && (
            <Chip dot="var(--accent-strong)">
              {dayOfWeek.chips.trough}{" "}
              <span className="num text-accent-strong">
                {dayOfWeek.chips.dayAmount(dayOfWeek.days[troughDow].toLowerCase(), euro0(stats[troughDow].avgAmount))}
              </span>
            </Chip>
          )}
          {weekendDeltaPct != null && (
            <Chip dot="var(--ink-4)">
              {dayOfWeek.chips.weekend}{" "}
              <span className="num text-accent-strong">
                {weekendDeltaPct >= 0 ? "+" : "−"}
                {dayOfWeek.deltaPct(String(Math.abs(Math.round(weekendDeltaPct))))}
              </span>{" "}
              {dayOfWeek.chips.weekendVsWeek}
            </Chip>
          )}
        </div>
      )}

      {/* average reference-line label, positioned over the bar column at its fraction. */}
      <div className={`${ROW_GRID} mt-4`}>
        <span aria-hidden />
        <div className="relative h-4">
          <span
            className="num absolute top-0 -translate-x-1/2 whitespace-nowrap text-2xs text-accent-strong"
            style={{ left: `${avgFrac * 100}%` }}
          >
            {dayOfWeek.averageLine(euro0(overall.avgAmount))}
          </span>
        </div>
        <span aria-hidden />
      </div>

      <div className="relative mt-1">
        {/* One delegated hover handler on the plot resolves the row by its
            data-dow attribute (like the heatmap), so the tooltip follows the
            cursor across the rows without making each row separately interactive. */}
        <div
          className="flex flex-col gap-2"
          role="img"
          aria-label={dayOfWeek.title}
          onMouseMove={(e) => {
            const row = (e.target as HTMLElement).closest<HTMLElement>("[data-dow]");
            if (row?.dataset.dow) {
              rowTip.show(e.clientX, e.clientY, Number(row.dataset.dow));
            }
          }}
          onMouseLeave={rowTip.clear}
        >
          {stats.map((s, dow) => {
            // Cached even when the toggle is off, so the compare marks can animate
            // out (gated on `renderCompare` at the render site, not here).
            const cs = compareStats?.[dow] ?? null;
            const level = overspendLevel(s.avgAmount, dayBudget);
            const compareDelta = cs ? deltaPct(s.avgAmount, cs.avgAmount) : null;
            const marker =
              dow === peakDow ? (
                <span className="text-neg">▲</span>
              ) : dow === troughDow ? (
                <span className="text-accent-strong">▼</span>
              ) : null;
            return (
              <div
                key={dayOfWeek.days[dow]}
                data-dow={dow}
                className={`${ROW_GRID} text-sm`}
              >
                <span className="flex items-center gap-1.5 text-ink-2">
                  <span className="inline-flex w-2 justify-center text-2xs leading-none">{marker}</span>
                  {dayOfWeek.days[dow]}
                </span>
                <div className="flex flex-col justify-center">
                  <div className="relative">
                    {dayBudget != null ? (
                      <WeekdayBulletBar
                        value={s.avgAmount}
                        dayBudget={dayBudget}
                        scaleMax={scaleMax}
                        height={22}
                      />
                    ) : (
                      <MeterBar
                        value={scaleFrac(s.avgAmount, scaleMax) * 100}
                        height={22}
                        opacity={0.85}
                      />
                    )}
                    {s.max > 0 && (
                      <Whisker
                        minFrac={scaleFrac(s.min, scaleMax)}
                        maxFrac={scaleFrac(s.max, scaleMax)}
                      />
                    )}
                  </div>
                  {hasCompareData && cs && (
                    <div
                      className="pt-1"
                      style={{ opacity: showCompare ? 1 : 0, transition: `opacity ${COMPARE_ANIM_MS}ms ease-out` }}
                    >
                      <CompareBar
                        frac={scaleFrac(cs.avgAmount, scaleMax)}
                        expanded={!barsCollapsed}
                      />
                    </div>
                  )}
                </div>
                <div className="num text-right">
                  <div className={`font-medium ${overspendTextClass(level)}`}>{euro(s.avgAmount)} €</div>
                  <small className="block text-2xs font-normal text-ink-4">
                    {dayOfWeek.transactionsPerDay(pct1(s.avgTx))}
                  </small>
                  {hasCompareData && cs && (
                    <small
                      className="mt-0.5 flex items-center justify-end gap-1 whitespace-nowrap text-2xs font-normal text-accent-d"
                      style={{ opacity: showCompare ? 1 : 0, transition: `opacity ${COMPARE_ANIM_MS}ms ease-out` }}
                    >
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-sm"
                        style={{ background: COMPARE_FILL }}
                        aria-hidden
                      />
                      {compareYear}{" "}
                      <AnimatedNumber
                        value={showCompare ? cs.avgAmount : 0}
                        decimals={2}
                        suffix=" €"
                      />
                      {compareDelta != null && (
                        <span className={compareDelta >= 0 ? "text-neg" : "text-accent-strong"}>
                          {compareDelta >= 0 ? "↑" : "↓"}{" "}
                          <AnimatedNumber
                            value={showCompare ? Math.abs(compareDelta) : 0}
                            decimals={0}
                            suffix=" %"
                          />
                        </span>
                      )}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full-height reference lines over the bar column: the optional colour-zone
            guides at the budget thresholds, plus the average line. */}
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{ left: DAY_COL_PX + COL_GAP_PX, right: AMOUNT_COL_PX + COL_GAP_PX }}
          aria-hidden
        >
          {dayBudget != null && dangerBudget != null && (
            <>
              <ThresholdGuide frac={scaleFrac(dayBudget, scaleMax)} />
              <ThresholdGuide frac={scaleFrac(dangerBudget, scaleMax)} />
            </>
          )}
          <span
            className="absolute inset-y-0"
            style={{
              left: `${avgFrac * 100}%`,
              marginLeft: -1,
              borderLeft: "2px dashed var(--accent-strong)",
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Budget thresholds as small ticks beneath the bar column (36 € / 71 €). */}
      {dayBudget != null && dangerBudget != null && (
        <div className={`${ROW_GRID} mt-2`}>
          <span aria-hidden />
          <div className="relative h-5">
            {[dayBudget, dangerBudget].map((amount) => (
              <div
                key={amount}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${scaleFrac(amount, scaleMax) * 100}%` }}
              >
                <span className="h-1.5 w-px bg-ink-4" />
                <span className="num mt-1 whitespace-nowrap text-2xs text-ink-4">{euro0(amount)} €</span>
              </div>
            ))}
          </div>
          <span aria-hidden />
        </div>
      )}

      {/* Legend. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-2xs text-ink-4">
        {dayBudget != null && dangerBudget != null && (
          <>
            <LegendItem
              swatch={
                <span
                  className="h-2 w-4 rounded-xs"
                  style={{ background: BAND_FILL.under }}
                />
              }
            >
              {dayOfWeek.legend.under(euro0(dayBudget))}
            </LegendItem>
            <LegendItem
              swatch={
                <span
                  className="h-2 w-4 rounded-xs"
                  style={{ background: BAND_FILL.between }}
                />
              }
            >
              {dayOfWeek.legend.between(euro0(dayBudget), euro0(dangerBudget))}
            </LegendItem>
            <LegendItem
              swatch={
                <span
                  className="h-2 w-4 rounded-xs"
                  style={{ background: BAND_FILL.over }}
                />
              }
            >
              {dayOfWeek.legend.over(euro0(dangerBudget))}
            </LegendItem>
          </>
        )}
        <LegendItem
          swatch={
            <span className="relative inline-block h-2.5 w-4">
              <span className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-ink-2/60" />
              <span className="absolute inset-y-0 left-0 w-px bg-ink-2" />
              <span className="absolute inset-y-0 right-0 w-px bg-ink-2" />
            </span>
          }
        >
          {dayOfWeek.legend.range}
        </LegendItem>
        <LegendItem swatch={<span className="inline-block h-0 w-4 border-t-2 border-dashed border-accent-strong/80" />}>
          {dayOfWeek.legend.average}
        </LegendItem>
        {hasCompareData && (
          <span
            className="inline-flex"
            style={{ opacity: showCompare ? 1 : 0, transition: `opacity ${COMPARE_ANIM_MS}ms ease-out` }}
          >
            <LegendItem
              swatch={
                <span
                  className="h-2 w-4 rounded-xs"
                  style={{ background: COMPARE_FILL }}
                />
              }
            >
              {dayOfWeek.legend.comparedYear(compareYear)}
            </LegendItem>
          </span>
        )}
      </div>

      <CursorTooltip
        point={rowTip.hover}
        maxWidth={270}
      >
        {rowTip.hover &&
          (() => {
            const dow = rowTip.hover.data;
            const s = stats[dow];
            const cs = showCompare && compareStats ? compareStats[dow] : null;
            const level = overspendLevel(s.avgAmount, dayBudget);
            const category = weekdayCategories?.[dow];
            const compareDelta = cs ? deltaPct(s.avgAmount, cs.avgAmount) : null;
            return (
              <div className="min-w-45">
                <div className="flex items-baseline justify-between gap-6 border-b border-line pb-1.5">
                  <span className="font-medium text-ink">{dayOfWeek.days[dow]}</span>
                  <span className={`num font-semibold ${overspendTextClass(level)}`}>{euro(s.avgAmount)} €</span>
                </div>
                <div className="mt-1.5 flex flex-col gap-0.5">
                  <TipRow
                    label={dayOfWeek.tooltip.range}
                    value={
                      <span className="num whitespace-nowrap">
                        {dayOfWeek.tooltip.rangeValue(euro0(s.min), euro0(s.max))}
                      </span>
                    }
                  />
                  <TipRow
                    label={dayOfWeek.tooltip.txPerDay}
                    value={<span className="num">{pct1(s.avgTx)}</span>}
                  />
                  <TipRow
                    label={dayOfWeek.tooltip.dominantCategory}
                    value={category?.name ?? dayOfWeek.tooltip.none}
                  />
                </div>
                {cs && (
                  <div className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
                    <TipRow
                      label={String(compareYear)}
                      value={
                        <span className="num text-accent-d">
                          {dayOfWeek.tooltip.compareValue(euro(cs.avgAmount), pct1(cs.avgTx))}
                        </span>
                      }
                    />
                    {compareDelta != null && (
                      <TipRow
                        label={dayOfWeek.tooltip.compareDelta}
                        value={
                          <span className="num">
                            <DeltaBadge pct={compareDelta} />
                          </span>
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })()}
      </CursorTooltip>
    </GlowCard>
  );
};

export default StatisticsDayOfWeek;
