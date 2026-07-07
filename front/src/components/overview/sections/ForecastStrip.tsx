"use client";

// MOCK — the end-of-month projection is a synthetic average-forward model
// (spent / days-elapsed × days-in-month). Spent + budget are real.

import getDaysInMonth from "date-fns/getDaysInMonth";
import getDate from "date-fns/getDate";
import isSameMonth from "date-fns/isSameMonth";
import isBefore from "date-fns/isBefore";
import startOfMonth from "date-fns/startOfMonth";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import { ProgressTrack } from "@components/dataviz";
import { euro0 } from "@components/overview/format";
import { cn } from "@lib/utils";

const ForecastStrip = () => {
  const { from } = useDatePickerWrapperStore();
  const {
    get: { data: dashboard },
    monthlyTotal,
  } = useDashboard();
  const budget = Number(dashboard?.initialAmount ?? 0);
  const now = new Date();
  const monthRef = from ?? now;
  const daysInMonth = getDaysInMonth(monthRef);
  // day-of-month is relative to the VIEWED month: elapsed for the current month,
  // the whole month for a past (complete) one, none for a future one.
  const dayOfMonth = isSameMonth(monthRef, now)
    ? getDate(now)
    : isBefore(startOfMonth(monthRef), startOfMonth(now))
      ? daysInMonth
      : 0;
  const projection =
    dayOfMonth > 0 ? (monthlyTotal / dayOfMonth) * daysInMonth : monthlyTotal; // MOCK
  const spentPct = budget > 0 ? Math.round((monthlyTotal / budget) * 100) : 0;
  const delta = projection - budget;

  return (
    <section className="pfa-card grid grid-cols-1 items-center gap-6 px-6 py-5 sm:grid-cols-[auto_1fr_auto]">
      <div>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
          Dépensé
        </span>
        <div className="num text-[22px] font-medium tracking-[-0.01em] text-ink">
          {euro0(monthlyTotal)} €
        </div>
        <div className="text-xs text-ink-3">{spentPct}% du budget</div>
      </div>

      <div className="pt-6">
        <ProgressTrack
          value={monthlyTotal}
          max={Math.max(budget, projection, 1)}
          projected={projection}
          marker={monthlyTotal}
          markerLabel="aujourd'hui"
          height={36}
          radius={8}
        />
      </div>

      <div className="text-right">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
          Projection fin de mois
        </span>
        <div className="num text-[22px] font-medium tracking-[-0.01em] text-ink">
          {euro0(projection)} €
        </div>
        <div
          className={cn(
            "text-xs",
            delta > 0 ? "text-neg" : "text-accent-strong",
          )}
        >
          {delta > 0
            ? `+${euro0(delta)} € vs budget`
            : `${euro0(delta)} € sous budget`}
        </div>
      </div>
    </section>
  );
};

export default ForecastStrip;
