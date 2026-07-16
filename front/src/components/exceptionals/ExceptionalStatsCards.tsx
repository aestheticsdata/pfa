"use client";

import { computeExceptionalStats } from "@components/exceptionals/helpers/exceptionalStats";
import GlowCard from "@components/shared/GlowCard";
import { StatTile } from "@components/shared/StatTile";
import { euro } from "@lib/format";
import exceptionals from "@text/exceptionals";
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
  <GlowCard className="px-5 py-4.5">
    <StatTile
      label={label}
      value={value}
      sub={sub}
    />
  </GlowCard>
);

const cur = (unit: string) => <span className="text-lg font-normal text-ink-3">{unit}</span>;

const ExceptionalStatsCards = ({ items, year, monthlyAverage }: ExceptionalStatsCardsProps) => {
  // Stable across re-renders so the elapsed-month count doesn't drift mid-session.
  const [now] = useState(() => new Date());
  const stats = computeExceptionalStats(items, year, now);
  const { stats: t } = exceptionals;

  // Part of total spending — derived from the real regular monthly average
  // (regular annual ≈ monthlyAverage × 12). Only meaningful for a single year.
  const regularAnnual = monthlyAverage * 12;
  const totalSpent = regularAnnual + stats.total;
  const canPart = year != null && monthlyAverage > 0 && totalSpent > 0;
  const part = canPart ? Math.round((stats.total / totalSpent) * 100) : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label={year != null ? t.totalYear(year) : t.totalAllYears}
        value={
          <>
            {euro(stats.total)}
            {cur(" €")}
          </>
        }
        sub={t.exceptionalCount(stats.count)}
      />
      <Kpi
        label={t.averagePerMonth}
        value={
          <>
            {euro(stats.average)}
            {cur(" €")}
          </>
        }
        sub={t.smoothedOver(stats.spanMonths)}
      />
      <Kpi
        label={t.biggest}
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
        label={t.partOfSpending}
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
        sub={year != null && part != null ? t.spentIn(euro(totalSpent), year) : t.unavailable}
      />
    </div>
  );
};

export default ExceptionalStatsCards;
