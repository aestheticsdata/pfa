"use client";

// MOCK — the end-of-month projection is a synthetic average-forward model
// (spent / days-elapsed × days-in-month). Spent + budget are real.

import getDaysInMonth from "date-fns/getDaysInMonth";
import getDate from "date-fns/getDate";
import useDashboard from "@components/spendings/services/useDashboard";
import { ProgressTrack } from "@components/dataviz";
import { euro0 } from "@components/overview/format";
import { cn } from "@lib/utils";

const ForecastStrip = () => {
  const {
    get: { data: dashboard },
    monthlyTotal,
  } = useDashboard();
  const budget = Number(dashboard?.initialAmount ?? 0);
  const now = new Date();
  const dayOfMonth = getDate(now);
  const daysInMonth = getDaysInMonth(now);
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
