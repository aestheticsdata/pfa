"use client";

import { computeExceptionalStats } from "@components/exceptionals/helpers/exceptionalStats";
import { StatTile } from "@components/shared/StatTile";
import { euro } from "@lib/format";
import format from "date-fns/format";
import { fr } from "date-fns/locale";
import { useState } from "react";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { ReactNode } from "react";

interface ExceptionalStatsCardsProps {
  items: ExceptionalItem[];
  year: number | null;
  monthlyAverage: number;
}

const Kpi = ({ label, value, sub }: { label: string; value: ReactNode; sub: ReactNode }) => (
  <StatTile
    className="rounded-xl border border-line-soft bg-surface-elev px-5 py-4.5"
    label={label}
    value={value}
    sub={sub}
  />
);

const cur = (unit: string) => <span className="text-lg font-normal text-ink-3">{unit}</span>;

const ExceptionalStatsCards = ({ items, year, monthlyAverage }: ExceptionalStatsCardsProps) => {
  // Stable across re-renders so the elapsed-month count doesn't drift mid-session.
  const [now] = useState(() => new Date());
  const stats = computeExceptionalStats(items, year, now);

  // Part of total spending — derived from the real regular monthly average
  // (regular annual ≈ monthlyAverage × 12). Only meaningful for a single year.
  const regularAnnual = monthlyAverage * 12;
  const totalSpent = regularAnnual + stats.total;
  const canPart = year != null && monthlyAverage > 0 && totalSpent > 0;
  const part = canPart ? Math.round((stats.total / totalSpent) * 100) : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label={year != null ? `Total ${year}` : "Total (toutes années)"}
        value={
          <>
            {euro(stats.total)}
            {cur(" €")}
          </>
        }
        sub={`${stats.count} achat${stats.count > 1 ? "s" : ""} exceptionnel${stats.count > 1 ? "s" : ""}`}
      />
      <Kpi
        label="Moyenne / mois"
        value={
          <>
            {euro(stats.average)}
            {cur(" €")}
          </>
        }
        sub={`lissée sur ${stats.spanMonths} mois`}
      />
      <Kpi
        label="Plus grosse dépense"
        value={
          stats.biggest ? (
            <>
              {euro(stats.biggest.amount)}
              {cur(" €")}
            </>
          ) : (
            "—"
          )
        }
        sub={
          stats.biggest
            ? `${stats.biggest.label} · ${format(stats.biggest.date, "MMMM", {
                locale: fr,
              })}`
            : "—"
        }
      />
      <Kpi
        label="Part des dépenses"
        value={
          part != null ? (
            <>
              {part}
              {cur(" %")}
            </>
          ) : (
            "—"
          )
        }
        sub={part != null ? `sur ${euro(totalSpent)} € dépensés en ${year}` : "indisponible"}
      />
    </div>
  );
};

export default ExceptionalStatsCards;
