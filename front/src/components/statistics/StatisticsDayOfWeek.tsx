"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { MeterBar } from "@components/shared/MeterBar";
import { OVERSPEND_DANGER_RATIO } from "@components/spendings/helpers/overspendLevel";
import { scaleFrac } from "@components/statistics/helpers/weekdayBullet";
import { weekdayAverages } from "@components/statistics/helpers/weekdayStats";
import WeekdayBulletBar from "@components/statistics/WeekdayBulletBar";
import { euro, euro0, pct1 } from "@lib/format";
import common from "@text/common";
import statistics from "@text/statistics";

import type { DailyStat } from "@src/schemas/stats";

const { dayOfWeek: t } = statistics;

// Row layout: fixed day-name and amount columns around the elastic bar column.
const GRID_COLS = "grid grid-cols-[90px_1fr_130px] gap-3";
const ROW_GRID = `${GRID_COLS} items-center`;

// Bar-column geometry, mirrored by the threshold guides so they span the full
// height of the plot and line up with the bars. Must match GRID_COLS: a 90px
// day-name column and a 130px amount column, each separated from the elastic bar
// column by gap-3 (12px).
const DAY_COL_PX = 90;
const AMOUNT_COL_PX = 130;
const COL_GAP_PX = 12;

// Fixed-scale headroom so the 2×budget marker always sits inside the bar with a
// little air past it, even when every weekday stays under it (COS-132).
const SCALE_HEADROOM = 1.12;

interface StatisticsDayOfWeekProps {
  year: number;
  now: Date;
  /** Per-day spending totals for the year (COS-45); `undefined` while the request is in flight. */
  days: DailyStat[] | undefined;
  /** Weekly ceiling (real data) — its per-day share drives the colour zones. */
  weeklyCeiling: number | null;
}

/** A dashed threshold line running the full height of the plot, over every bar. */
const ThresholdGuide = ({ frac }: { frac: number }) => (
  <span
    className="absolute inset-y-0"
    style={{ left: `${frac * 100}%`, marginLeft: -1, borderLeft: "2px dashed var(--ink)", opacity: 0.6 }}
  />
);

/** A dashed threshold's euro value, centred under its guide on the bar column. */
const ThresholdLabel = ({ frac, amount }: { frac: number; amount: number }) => (
  <span
    className="num absolute top-0 -translate-x-1/2 whitespace-nowrap text-2xs text-ink-4"
    style={{ left: `${frac * 100}%` }}
  >
    {euro0(amount)} €
  </span>
);

/** "Dépenses par jour de la semaine" — real weekday spending rhythm (COS-48, COS-132). */
const StatisticsDayOfWeek = ({ year, now, days, weeklyCeiling }: StatisticsDayOfWeekProps) => {
  if (days === undefined) {
    return (
      <GlowCard
        as="section"
        className="px-6 py-5.5"
      >
        <CardSectionHeader
          title={t.title}
          meta={t.meta(year)}
        />
        <div className="grid place-items-center py-10 text-sm text-ink-4">{common.loading}</div>
      </GlowCard>
    );
  }

  const stats = weekdayAverages(days, year, now);
  const maxAmount = Math.max(...stats.map((s) => s.avgAmount), 1);
  // Per-weekday budget = the weekly ceiling spread over 7 days (COS-34 rule).
  const dayBudget = weeklyCeiling != null && weeklyCeiling > 0 ? weeklyCeiling / 7 : null;

  // Fixed euro scale shared by all seven bars: wide enough to always show the
  // 2×budget marker, so the two thresholds stay put across the days and only the
  // bar lengths change. Without a ceiling there are no thresholds — fall back to
  // the old scale-to-day-max neutral bar.
  const scaleMax = dayBudget != null ? Math.max(maxAmount, dayBudget * OVERSPEND_DANGER_RATIO) * SCALE_HEADROOM : 1;

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <CardSectionHeader
        title={t.title}
        meta={t.meta(year)}
      />

      <div className="relative mt-4.5">
        <div className="flex flex-col gap-2">
          {stats.map((s, dow) => (
            <div
              key={t.days[dow]}
              className={`${ROW_GRID} text-sm`}
            >
              <span className="text-ink-2">{t.days[dow]}</span>
              {dayBudget != null ? (
                <WeekdayBulletBar
                  value={s.avgAmount}
                  dayBudget={dayBudget}
                  scaleMax={scaleMax}
                  height={22}
                />
              ) : (
                <MeterBar
                  value={(s.avgAmount / maxAmount) * 100}
                  height={22}
                  opacity={0.85}
                />
              )}
              <span className="num text-right font-medium text-ink">
                {euro(s.avgAmount)} €
                <small className="block text-2xs font-normal text-ink-4">{t.transactionsPerDay(pct1(s.avgTx))}</small>
              </span>
            </div>
          ))}
        </div>

        {/* Continuous threshold guides: the budget and 2×budget markers are the
            same for the seven days, so they run top-to-bottom over the whole plot
            (across the gaps too) as one reference axis, not per-bar dashes. */}
        {dayBudget != null && (
          <div
            className="pointer-events-none absolute inset-y-0"
            style={{ left: DAY_COL_PX + COL_GAP_PX, right: AMOUNT_COL_PX + COL_GAP_PX }}
            aria-hidden
          >
            <ThresholdGuide frac={scaleFrac(dayBudget, scaleMax)} />
            <ThresholdGuide frac={scaleFrac(dayBudget * OVERSPEND_DANGER_RATIO, scaleMax)} />
          </div>
        )}
      </div>

      {/* Threshold values, labelled once beneath the bar column. */}
      {dayBudget != null && (
        <div className={`${ROW_GRID} mt-1.5`}>
          <span aria-hidden />
          <div className="relative h-3.5">
            <ThresholdLabel
              frac={scaleFrac(dayBudget, scaleMax)}
              amount={dayBudget}
            />
            <ThresholdLabel
              frac={scaleFrac(dayBudget * OVERSPEND_DANGER_RATIO, scaleMax)}
              amount={dayBudget * OVERSPEND_DANGER_RATIO}
            />
          </div>
          <span aria-hidden />
        </div>
      )}
    </GlowCard>
  );
};

export default StatisticsDayOfWeek;
