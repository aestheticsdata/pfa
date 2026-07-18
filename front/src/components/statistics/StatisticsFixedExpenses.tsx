"use client";

// All figures are real (from /reccurings). Recurrings carry no category, so —
// exactly as the mockup notes — they are totalled by name. The only estimate is
// "déjà prélevé", derived from each line's charge-day vs today (MOCK: recurrings
// have no dedicated charge-day field, so the day-of-month of `dateFrom` is used).

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { MeterBar } from "@components/shared/MeterBar";
import { Overline } from "@components/shared/Overline";
import { CursorTooltip, useCursorHover } from "@lib/dataviz";
import { euro, splitAmount } from "@lib/format";
import statistics from "@text/statistics";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";

import type { RecurringItem } from "@src/schemas/spendings";

interface StatisticsFixedExpensesProps {
  recurrings: RecurringItem[];
  now: Date;
}

/** Charge day-of-month, from the recurring's `dateFrom` (best real proxy). */
const chargeDay = (r: RecurringItem): number => {
  const d = getDate(parseISO(r.dateFrom));
  return Number.isNaN(d) ? 1 : d;
};

const Stat = ({
  label,
  value,
  small,
  className = "",
}: {
  label: string;
  value: number;
  small?: boolean;
  className?: string;
}) => {
  const { int, dec } = splitAmount(value);
  return (
    <div className={className}>
      <Overline className="block">{label}</Overline>
      <div
        className={
          small
            ? "num mt-2 text-lg font-medium tracking-tight text-ink-2"
            : "num mt-2 text-3xl font-medium tracking-tight text-ink"
        }
      >
        {int}
        <span className={small ? "text-sm font-normal text-ink-3" : "text-xl font-normal text-ink-3"}>,{dec} €</span>
      </div>
    </div>
  );
};

/** "Dépenses fixes" — recurrings annualised, with per-line share and the
 *  year-to-date drawn amount. */
const StatisticsFixedExpenses = ({ recurrings, now }: StatisticsFixedExpensesProps) => {
  const rowTip = useCursorHover<{ monthly: string; day: number }>();
  if (recurrings.length === 0) return null;

  const { fixedExpenses: t } = statistics;

  const list = [...recurrings].sort((a, b) => Number(b.amount) - Number(a.amount));
  const monthlyTotal = list.reduce((sum, r) => sum + Number(r.amount), 0);
  const annualTotal = monthlyTotal * 12;
  const maxAmount = Number(list[0].amount) || 1;

  const monthsElapsed = now.getMonth(); // fully-elapsed months before this one
  const today = getDate(now);
  const drawn = list.reduce((sum, r) => sum + Number(r.amount) * (monthsElapsed + (chargeDay(r) <= today ? 1 : 0)), 0);
  const topShare = Math.round((Number(list[0].amount) / monthlyTotal) * 100);

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <CardSectionHeader
        title={t.title}
        meta={t.meta(list.length)}
      />

      <div className="mt-4.5 flex flex-wrap items-baseline gap-x-10 gap-y-4 border-b border-line-soft pb-5">
        <Stat
          label={t.annualTotal}
          value={annualTotal}
        />
        <Stat
          label={t.monthly}
          value={monthlyTotal}
          small
        />
        <Stat
          label={t.drawn(format(now, "d MMM", { locale: fr }))}
          value={drawn}
          small
          className="ml-auto text-right"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-9 gap-y-3.5 sm:grid-cols-2">
        {list.map((r) => {
          const annual = Number(r.amount) * 12;
          const share = Math.round((Number(r.amount) / monthlyTotal) * 100);
          const barWidth = (Number(r.amount) / maxAmount) * 100;
          return (
            <div
              key={r.ID}
              className="flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-2.5 text-sm">
                <span
                  className="text-ink"
                  role="img"
                  aria-label={r.label}
                  onMouseMove={rowTip.move({ monthly: euro(Number(r.amount)), day: chargeDay(r) })}
                  onMouseLeave={rowTip.clear}
                >
                  {r.label}
                </span>
                <span className="num ml-auto font-medium text-ink">
                  {euro(annual)} €<small className="ml-1.5 text-2xs font-normal text-ink-4">{share}%</small>
                </span>
              </div>
              <MeterBar
                value={barWidth}
                height={7}
                opacity={0.9}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-5 border-t border-line-soft pt-4.5 text-xs text-ink-4">{t.note(list[0].label, topShare)}</p>

      <CursorTooltip point={rowTip.hover}>
        {rowTip.hover ? t.tooltip.row(rowTip.hover.data.monthly, rowTip.hover.data.day) : null}
      </CursorTooltip>
    </GlowCard>
  );
};

export default StatisticsFixedExpenses;
