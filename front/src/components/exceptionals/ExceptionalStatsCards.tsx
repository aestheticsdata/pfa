"use client";

import { useMemo } from "react";
import { CircleDollarSign, Calendar, TrendingUp, Filter } from "lucide-react";
import { SurfaceCard } from "@components/ui/surface-card";

import type { ExceptionalItem } from "@src/schemas/exceptionals";

interface ExceptionalStatsCardsProps {
  items: ExceptionalItem[];
  year: number;
}

const ExceptionalStatsCards = ({ items, year }: ExceptionalStatsCardsProps) => {
  const stats = useMemo(() => {
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const count = items.length;
    const biggest = items.reduce(
      (max, item) => Math.max(max, Number(item.amount)),
      0,
    );
    const average = total / 12;
    return { total, count, biggest, average };
  }, [items]);

  const fmt = (v: number) =>
    v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SurfaceCard padding="lg" className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider">
          <span className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
            <CircleDollarSign className="w-4 h-4 text-cyan-400" />
          </span>
          Total {year}
        </div>
        <div className="text-gray-100 text-2xl font-bold tabular-nums">
          {fmt(stats.total)} €
        </div>
      </SurfaceCard>

      <SurfaceCard padding="lg" className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider">
          <span className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-400" />
          </span>
          Moyenne / mois
        </div>
        <div className="text-gray-100 text-2xl font-bold tabular-nums">
          {fmt(stats.average)} €
        </div>
      </SurfaceCard>

      <SurfaceCard padding="lg" className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider">
          <span className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </span>
          Plus grosse dépense
        </div>
        <div className="text-gray-100 text-2xl font-bold tabular-nums">
          {fmt(stats.biggest)} €
        </div>
      </SurfaceCard>

      <SurfaceCard padding="lg" className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider">
          <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <Filter className="w-4 h-4 text-emerald-400" />
          </span>
          Nombre d&apos;achats
        </div>
        <div className="text-gray-100 text-2xl font-bold tabular-nums">
          {stats.count}
        </div>
      </SurfaceCard>
    </div>
  );
};

export default ExceptionalStatsCards;
