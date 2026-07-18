"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { MeterBar } from "@components/shared/MeterBar";
import overspendLevel from "@components/spendings/helpers/overspendLevel";
import { weekdayAverages } from "@components/statistics/helpers/weekdayStats";
import { euro, pct1 } from "@lib/format";
import common from "@text/common";
import statistics from "@text/statistics";

import type { OverspendLevel } from "@components/spendings/helpers/overspendLevel";
import type { DailyStat } from "@src/schemas/stats";

const { dayOfWeek: t } = statistics;

interface StatisticsDayOfWeekProps {
  year: number;
  now: Date;
  /** Per-day spending totals for the year (COS-45); `undefined` while the request is in flight. */
  days: DailyStat[] | undefined;
  /** Weekly ceiling (real data) — its per-day share drives the colour ramp. */
  weeklyCeiling: number | null;
}

// Bar fill by overspend level: green under the daily budget, orange over it, red
// well over it — same orange-before-red philosophy as COS-34 / COS-36.
const FILL: Record<OverspendLevel, string> = {
  normal: "var(--bar-fill)",
  warn: "linear-gradient(90deg, oklch(0.60 0.13 70), var(--warn))",
  danger: "linear-gradient(90deg, oklch(0.50 0.13 25), oklch(0.72 0.16 25))",
};

/** "Dépenses par jour de la semaine" — real weekday spending rhythm (COS-48). */
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

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <CardSectionHeader
        title={t.title}
        meta={t.meta(year)}
      />

      <div className="mt-4.5 flex flex-col gap-2">
        {stats.map((s, dow) => (
          <div
            key={t.days[dow]}
            className="grid grid-cols-[90px_1fr_130px] items-center gap-3 text-sm"
          >
            <span className="text-ink-2">{t.days[dow]}</span>
            <MeterBar
              value={(s.avgAmount / maxAmount) * 100}
              fill={FILL[overspendLevel(s.avgAmount, dayBudget)]}
              height={22}
              opacity={0.85}
            />
            <span className="num text-right font-medium text-ink">
              {euro(s.avgAmount)} €
              <small className="block text-2xs font-normal text-ink-4">{t.transactionsPerDay(pct1(s.avgTx))}</small>
            </span>
          </div>
        ))}
      </div>
    </GlowCard>
  );
};

export default StatisticsDayOfWeek;
