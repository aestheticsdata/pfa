"use client";

import { DividedStrip } from "@components/shared/DividedStrip";
import { MoneyAmount } from "@components/shared/MoneyAmount";
import { Overline } from "@components/shared/Overline";
import { StatTile } from "@components/shared/StatTile";
import { AnimatedNumber } from "@lib/dataviz";
import { splitAmount } from "@lib/format";
import { cn } from "@lib/utils";
import spendings from "@text/spendings";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";

import type { ReactNode } from "react";

interface Biggest {
  label: string;
  amount: number;
  date: Date;
}

interface SpendingSummaryProps {
  /** Remaining monthly budget (real data via useDashboard) — hero widget. */
  remaining: number;
  weekTotal: number;
  txCount: number;
  weeklyCeiling: number | null;
  /** MOCK — average-per-day delta vs last week (euros). */
  avgDailyDelta: number;
  biggest: Biggest | null;
}

const Cell = ({ label, value, sub }: { label: string; value: ReactNode; sub: ReactNode }) => (
  <StatTile
    className="bg-card px-5 py-4"
    label={label}
    value={value}
    sub={sub}
  />
);

const SpendingSummary = ({
  remaining,
  weekTotal,
  txCount,
  weeklyCeiling,
  avgDailyDelta,
  biggest,
}: SpendingSummaryProps) => {
  const { summary: t } = spendings;
  const perDay = (txCount / 7).toFixed(1).replace(".", ",");
  const average = weekTotal / 7;

  // Hero "budget restant" — big number, split integer/decimals like the Dashboard
  // BudgetHero, red when over budget. The integer counts up via the reusable
  // AnimatedNumber component; the cents stay fixed beside it.
  const over = remaining < 0;
  const { int: remainingInt, dec: remainingDec } = splitAmount(Math.abs(remaining));
  const remainingIntValue = Number(remainingInt.replace(/\D/g, ""));

  const ceilingSub =
    weeklyCeiling != null && weeklyCeiling > 0 ? (
      weekTotal > weeklyCeiling ? (
        <span className="text-neg">{t.overCeiling(Math.round(weekTotal - weeklyCeiling))}</span>
      ) : (
        <span className="text-accent-strong">{t.underCeiling(Math.round(weeklyCeiling - weekTotal))}</span>
      )
    ) : (
      t.ceilingUndefined
    );

  const roundedDelta = Math.round(avgDailyDelta);
  const avgSub =
    roundedDelta === 0 ? (
      <span className="text-ink-4">{t.deltaStable}</span>
    ) : roundedDelta > 0 ? (
      <span className="text-neg">{t.deltaUp(roundedDelta)}</span>
    ) : (
      <span className="text-accent-strong">{t.deltaDown(Math.abs(roundedDelta))}</span>
    );

  return (
    <DividedStrip className="grid-cols-2 min-[760px]:grid-cols-5">
      {/* Hero — full-width banner on mobile, one equal-width cell (1/5) on desktop
          like the other four. Its font stays big; the four keep theirs too. */}
      <div className="col-span-2 bg-card px-5 py-4 min-[760px]:col-span-1">
        <Overline className="mb-2 block">{t.remaining}</Overline>
        <div
          className={cn(
            "num text-4xl font-medium leading-none tracking-tight min-[1100px]:text-5xl",
            over ? "text-neg" : "text-ink",
          )}
        >
          {over && "−"}
          <AnimatedNumber value={remainingIntValue} />
          <span className="text-lg font-normal text-ink-3 min-[1100px]:text-2xl">,{remainingDec} €</span>
        </div>
      </div>
      <Cell
        label={t.weekTotal}
        value={
          <MoneyAmount
            value={weekTotal}
            decimalClassName="text-lg"
          />
        }
        sub={ceilingSub}
      />
      <Cell
        label={t.transactions}
        value={txCount}
        sub={t.transactionsSub(perDay)}
      />
      <Cell
        label={t.avgPerDay}
        value={
          <MoneyAmount
            value={average}
            decimalClassName="text-lg"
          />
        }
        // MOCK sub — cross-week delta (see mockSpending.ts)
        sub={avgSub}
      />
      <Cell
        label={t.biggest}
        value={
          biggest ? (
            <MoneyAmount
              value={biggest.amount}
              decimalClassName="text-lg"
            />
          ) : (
            "—"
          )
        }
        sub={biggest ? `${biggest.label} · ${format(biggest.date, "dd MMM", { locale: fr })}` : "—"}
      />
    </DividedStrip>
  );
};

export default SpendingSummary;
