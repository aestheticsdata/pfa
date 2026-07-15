"use client";

// MOCK — there is no per-transaction / day-of-week aggregation endpoint, so
// these weekly averages are illustrative sample values.

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { MeterBar } from "@components/shared/MeterBar";

interface DayRow {
  day: string;
  width: number;
  amount: string;
  transactions: string;
  weekend?: boolean;
}

const ROWS: DayRow[] = [
  { day: "Lundi", width: 42, amount: "38,20 €", transactions: "3,2 transactions/j" },
  { day: "Mardi", width: 48, amount: "44,10 €", transactions: "3,5 transactions/j" },
  { day: "Mercredi", width: 55, amount: "50,80 €", transactions: "4,1 transactions/j" },
  { day: "Jeudi", width: 51, amount: "46,90 €", transactions: "3,7 transactions/j" },
  { day: "Vendredi", width: 64, amount: "58,60 €", transactions: "4,5 transactions/j" },
  { day: "Samedi", width: 96, amount: "88,40 €", transactions: "5,2 transactions/j", weekend: true },
  { day: "Dimanche", width: 78, amount: "71,20 €", transactions: "4,4 transactions/j", weekend: true },
];

const WEEKDAY_FILL = "var(--bar-fill)";
const WEEKEND_FILL = "linear-gradient(90deg, oklch(0.50 0.13 25), oklch(0.72 0.16 25))";

/** "Dépenses par jour de la semaine" — weekly spending rhythm (MOCK). */
const StatisticsDayOfWeek = () => (
  <GlowCard
    as="section"
    className="px-6 py-5.5"
  >
    <CardSectionHeader
      title="Dépenses par jour de la semaine"
      meta="moyenne sur 12 mois"
    />

    <div className="mt-4.5 flex flex-col gap-2">
      {ROWS.map((row) => (
        <div
          key={row.day}
          className="grid grid-cols-[90px_1fr_130px] items-center gap-3 text-sm"
        >
          <span className={row.weekend ? "text-ink" : "text-ink-2"}>{row.day}</span>
          <MeterBar
            value={row.width}
            fill={row.weekend ? WEEKEND_FILL : WEEKDAY_FILL}
            height={22}
            opacity={0.85}
          />
          <span className="num text-right font-medium text-ink">
            {row.amount}
            <small className="block text-2xs font-normal text-ink-4">{row.transactions}</small>
          </span>
        </div>
      ))}
    </div>
  </GlowCard>
);

export default StatisticsDayOfWeek;
