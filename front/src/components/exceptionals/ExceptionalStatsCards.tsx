"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { fr } from "date-fns/locale";

import type { ExceptionalItem } from "@src/schemas/exceptionals";

interface ExceptionalStatsCardsProps {
  items: ExceptionalItem[];
  year: number | null;
  monthlyAverage: number;
}

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const Kpi = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
}) => (
  <div className="rounded-[14px] border border-line-soft bg-bg-elev px-5 py-[18px]">
    <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
      {label}
    </div>
    <div className="num mt-2 text-[26px] font-medium tracking-[-0.02em] text-ink">
      {value}
    </div>
    <div className="mt-1 text-xs text-ink-3">{sub}</div>
  </div>
);

const cur = (unit: string) => (
  <span className="text-[17px] font-normal text-ink-3">{unit}</span>
);

const ExceptionalStatsCards = ({
  items,
  year,
  monthlyAverage,
}: ExceptionalStatsCardsProps) => {
  const stats = useMemo(() => {
    let total = 0;
    let biggest: { label: string; amount: number; date: Date } | null = null;
    const years = new Set<number>();
    for (const item of items) {
      const amount = Number(item.amount);
      total += amount;
      const date = parseISO(item.date);
      years.add(date.getFullYear());
      if (!biggest || amount > biggest.amount) {
        biggest = { label: item.label, amount, date };
      }
    }
    // For a single year: smoothed over 12 months. For "all years": over the
    // span actually covered by the data.
    const months = year != null ? 12 : 12 * Math.max(1, years.size);
    return {
      total,
      count: items.length,
      biggest,
      average: total / months,
      spanMonths: months,
    };
  }, [items, year]);

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
            {fmt(stats.total)}
            {cur(" €")}
          </>
        }
        sub={`${stats.count} achat${stats.count > 1 ? "s" : ""} exceptionnel${
          stats.count > 1 ? "s" : ""
        }`}
      />
      <Kpi
        label="Moyenne / mois"
        value={
          <>
            {fmt(stats.average)}
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
              {fmt(stats.biggest.amount)}
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
        sub={
          part != null
            ? `sur ${fmt(totalSpent)} € dépensés en ${year}`
            : "indisponible"
        }
      />
    </div>
  );
};

export default ExceptionalStatsCards;
