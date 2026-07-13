"use client";

import { AnimatedNumber } from "@lib/dataviz";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";

import type { ReactNode } from "react";

const splitAmount = (n: number): { int: string; dec: string } => {
  const [int, dec = "00"] = Number(n)
    .toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .split(",");
  return { int, dec };
};

const Amount = ({ value, unit = " €" }: { value: number; unit?: string }) => {
  const { int, dec } = splitAmount(value);
  return (
    <>
      {int}
      <span className="text-[18px] font-normal text-ink-3">
        ,{dec}
        {unit}
      </span>
    </>
  );
};

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
  <div className="bg-background px-5 py-4">
    <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">{label}</span>
    <div className="num text-[24px] font-medium leading-none tracking-[-0.02em] text-ink">{value}</div>
    <div className="mt-1.5 text-xs text-ink-3">{sub}</div>
  </div>
);

const SpendingSummary = ({
  remaining,
  weekTotal,
  txCount,
  weeklyCeiling,
  avgDailyDelta,
  biggest,
}: SpendingSummaryProps) => {
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
        <span className="text-neg">+{Math.round(weekTotal - weeklyCeiling)} € vs plafond</span>
      ) : (
        <span className="text-accent-strong">−{Math.round(weeklyCeiling - weekTotal)} € sous plafond</span>
      )
    ) : (
      "plafond non défini"
    );

  const roundedDelta = Math.round(avgDailyDelta);
  const avgSub =
    roundedDelta === 0 ? (
      <span className="text-ink-4">stable vs sem. dernière</span>
    ) : roundedDelta > 0 ? (
      <span className="text-neg">+{roundedDelta} € vs sem. dernière</span>
    ) : (
      <span className="text-accent-strong">−{Math.abs(roundedDelta)} € vs sem. dernière</span>
    );

  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line-soft bg-line-soft min-[760px]:grid-cols-5">
      {/* Hero — full-width banner on mobile, one equal-width cell (1/5) on desktop
          like the other four. Its font stays big; the four keep theirs too. */}
      <div className="col-span-2 bg-background px-5 py-4 min-[760px]:col-span-1">
        <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
          Budget restant
        </span>
        <div
          className={cn(
            "num text-[34px] font-medium leading-none tracking-[-0.02em] min-[1100px]:text-[46px]",
            over ? "text-neg" : "text-ink",
          )}
        >
          {over && "−"}
          <AnimatedNumber value={remainingIntValue} />
          <span className="text-[18px] font-normal text-ink-3 min-[1100px]:text-[26px]">,{remainingDec} €</span>
        </div>
      </div>
      <Cell
        label="Total semaine"
        value={<Amount value={weekTotal} />}
        sub={ceilingSub}
      />
      <Cell
        label="Transactions"
        value={txCount}
        sub={`sur 7 jours · ${perDay}/jour`}
      />
      <Cell
        label="Moyenne / jour"
        value={<Amount value={average} />}
        // MOCK sub — cross-week delta (see mockSpending.ts)
        sub={avgSub}
      />
      <Cell
        label="Plus grosse"
        value={biggest ? <Amount value={biggest.amount} /> : "—"}
        sub={biggest ? `${biggest.label} · ${format(biggest.date, "dd MMM", { locale: fr })}` : "—"}
      />
    </section>
  );
};

export default SpendingSummary;
