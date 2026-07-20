"use client";

// All figures are real (from /recurrings). Recurrings carry no category, so —
// exactly as the mockup notes — they are totalled by name. "Déjà prélevé" is the
// real year-to-date sum of the per-month recurring rows (Jan → current month),
// computed server-side (GET /recurrings/drawn) and passed in as `drawn`.

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { MeterBar } from "@components/shared/MeterBar";
import { Overline } from "@components/shared/Overline";
import { CursorTooltip, useCursorHover } from "@lib/dataviz";
import { euro, splitAmount } from "@lib/format";
import statistics from "@text/statistics";

import type { RecurringItem } from "@src/schemas/spendings";

interface StatisticsFixedExpensesProps {
  recurrings: RecurringItem[];
  drawn: number;
  now: Date;
}

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
const StatisticsFixedExpenses = ({ recurrings, drawn, now }: StatisticsFixedExpensesProps) => {
  const rowTip = useCursorHover<{ monthly: string }>();
  if (recurrings.length === 0) return null;

  const { fixedExpenses: t } = statistics;

  const list = [...recurrings].sort((a, b) => Number(b.amount) - Number(a.amount));
  const monthlyTotal = list.reduce((sum, r) => sum + Number(r.amount), 0);
  const annualTotal = monthlyTotal * 12;
  const maxAmount = Number(list[0].amount) || 1;
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
          label={t.drawn(now.getFullYear())}
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
                  onMouseMove={rowTip.move({ monthly: euro(Number(r.amount)) })}
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
        {rowTip.hover ? t.tooltip.row(rowTip.hover.data.monthly) : null}
      </CursorTooltip>
    </GlowCard>
  );
};

export default StatisticsFixedExpenses;
