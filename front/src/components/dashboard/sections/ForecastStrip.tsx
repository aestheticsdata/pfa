"use client";

// MOCK — the end-of-month projection is a synthetic average-forward model
// (spent / days-elapsed × days-in-month). Spent + budget are real.

import { euro0 } from "@components/dashboard/format";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import { AnimatedNumber, ProgressTrack } from "@lib/dataviz";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isBefore from "date-fns/isBefore";
import isSameMonth from "date-fns/isSameMonth";
import fr from "date-fns/locale/fr";
import startOfMonth from "date-fns/startOfMonth";

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
  const isThisMonth = isSameMonth(monthRef, now);
  const isPastMonth = isBefore(startOfMonth(monthRef), startOfMonth(now));
  // day-of-month is relative to the VIEWED month: elapsed for the current month,
  // the whole month for a past (complete) one, none for a future one.
  const dayOfMonth = isThisMonth ? getDate(now) : isPastMonth ? daysInMonth : 0;
  // "as of" date shown next to "Dépensé"
  const asOf = isThisMonth ? now : isPastMonth ? endOfMonth(monthRef) : startOfMonth(monthRef);
  const projection = dayOfMonth > 0 ? (monthlyTotal / dayOfMonth) * daysInMonth : monthlyTotal; // MOCK
  const spentPct = budget > 0 ? Math.round((monthlyTotal / budget) * 100) : 0;
  const delta = projection - budget;

  return (
    <section className="pfa-card grid grid-cols-1 items-center gap-6 px-6 py-5 sm:grid-cols-[200px_1fr_200px] sm:gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-2xs font-medium uppercase tracking-caps text-ink-4">
          Dépensé · {format(asOf, "d MMM", { locale: fr })}
        </span>
        <AnimatedNumber
          value={monthlyTotal}
          decimals={0}
          suffix=" €"
          className="num text-xl font-medium tracking-normal text-ink"
        />
        <span className="text-xs text-ink-3">{spentPct}% du budget</span>
      </div>

      <div className="pt-6">
        <ProgressTrack
          key={`${format(monthRef, "yyyy-MM")}-${monthlyTotal > 0 || projection > 0 ? "d" : "e"}`}
          value={monthlyTotal}
          max={budget > 0 ? budget : Math.max(projection, monthlyTotal, 1)}
          projected={projection}
          marker={monthlyTotal}
          markerLabel="aujourd'hui"
          gradient
          animate
          height={36}
          radius={8}
        />
        <div className="mt-2 flex items-center justify-between text-2xs text-ink-4">
          <span className="num">0 €</span>
          <span className="flex items-center gap-4 text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-3 rounded-xs"
                style={{
                  background: "linear-gradient(90deg,var(--accent-d),var(--accent-strong))",
                  opacity: 0.55,
                }}
              />
              réalisé
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-3 rounded-xs border border-accent-d"
                style={{
                  background: "repeating-linear-gradient(45deg,transparent 0 3px,var(--accent-d) 3px 6px)",
                }}
              />
              projection
            </span>
          </span>
          <span className="num">{euro0(budget)} € budget</span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1 sm:items-end sm:text-right">
        <span className="text-2xs font-medium uppercase tracking-caps text-ink-4">Projection fin de mois</span>
        <AnimatedNumber
          value={projection}
          decimals={0}
          suffix=" €"
          color={delta > 0 ? "var(--neg)" : "var(--accent-strong)"}
          className="num text-xl font-medium tracking-normal"
        />
        <span className="text-xs text-ink-3">
          <span className={delta > 0 ? "text-neg" : "text-accent-strong"}>
            {delta > 0 ? `+${euro0(delta)} €` : `${euro0(delta)} €`}
          </span>{" "}
          {delta > 0 ? "au-dessus" : "sous budget"}
        </span>
      </div>
    </section>
  );
};

export default ForecastStrip;
