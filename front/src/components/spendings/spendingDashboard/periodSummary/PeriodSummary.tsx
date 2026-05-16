"use client";

import { useEffect, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { Calendar as CalendarIcon, TrendingDown, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import useWeeklyStats from "@components/spendings/services/useWeeklyStats";
import useWeeklyStatsHelper from "@components/spendings/spendingDashboard/weeklyStats/helpers/useWeeklyStatsHelper";
import { accurateFixed } from "@helpers/mathExprEval";
import { SurfaceCard } from "@components/ui/surface-card";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import spendingsText from "@components/spendings/config/text";

interface InitialCeiling {
  initialCeiling: string;
}

const CEILING_WARN_LIMIT = 50;

const PeriodSummary = () => {
  const { from, to } = useDatePickerWrapperStore();
  const { makeSlices, makeRange, isCurrentWeek } = useWeeklyStatsHelper();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const {
    get: { data: weeklyStats, error: weeklyStatsError },
    mutation,
  } = useWeeklyStats();
  const {
    get: { data: dashboard, error: dashboardError },
  } = useDashboard();
  const { register, handleSubmit, setFocus } = useForm<InitialCeiling>();

  if (weeklyStatsError) {
    throw weeklyStatsError;
  }

  if (dashboardError) {
    throw dashboardError;
  }

  const initialCeiling = dashboard ? +dashboard.initialCeiling : 0;
  const weeklySlices = from ? makeSlices(makeRange(from)) : [];
  const zeroedOutWeeklyStats = weeklyStats?.filter(Boolean) ?? [];
  const averageWeeklyStatsAmount =
    zeroedOutWeeklyStats.length > 0
      ? accurateFixed(
          zeroedOutWeeklyStats.reduce(
            (acc: number, curr: number) => acc + curr,
            0,
          ) / zeroedOutWeeklyStats.length,
          1,
        )
      : 0;

  const currentWeekIdx =
    from && weeklySlices.length > 0
      ? weeklySlices.findIndex((s) => isCurrentWeek(s, from))
      : -1;
  const periodTotal =
    currentWeekIdx >= 0 && weeklyStats?.[currentWeekIdx] != null
      ? Number(weeklyStats[currentWeekIdx])
      : 0;

  const periodCeilingDiff = periodTotal - initialCeiling;
  const isOverBudget = periodCeilingDiff > 0;

  const onSubmit = (value: InitialCeiling) => {
    setIsInputVisible(false);
    mutation.mutate(value.initialCeiling);
  };

  const canEditWeeklyCeiling = dashboard != null;

  const closeCeilingFormIfFocusLeft = (e: FocusEvent<HTMLFormElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) {
      return;
    }
    setIsInputVisible(false);
  };

  useEffect(() => {
    if (isInputVisible) {
      setFocus("initialCeiling", { shouldSelect: true });
    }
  }, [setFocus, isInputVisible]);

  const rangeLabel =
    from && to
      ? `${format(from, "dd MMM yyyy", { locale: fr })} — ${format(to, "dd MMM yyyy", { locale: fr })}`
      : "";

  return (
    <SurfaceCard padding="lg" className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-300 text-sm">Total par période</span>
        <CalendarIcon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="mb-2 text-sm text-gray-200">{rangeLabel}</div>
      <div className="flex items-baseline gap-3 mb-6 flex-wrap">
        <span className="text-gray-100 text-lg font-medium">
          {Number(periodTotal).toFixed(1)} €
        </span>
        {initialCeiling > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              isOverBudget ? "text-rose-400" : "text-emerald-400",
            )}
            title={
              isOverBudget
                ? "Dépassement du plafond hebdomadaire"
                : "Sous le plafond hebdomadaire"
            }
          >
            {isOverBudget ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5" />
            )}
            {Math.abs(periodCeilingDiff).toFixed(0)} €
          </span>
        )}
      </div>

      <div className="space-y-2.5 mb-6">
        <div className="group flex items-center gap-2 text-gray-300 pb-2 border-b border-gray-700/50 text-sm">
          <TrendingDown className="w-4 h-4" />
          <span>{spendingsText.dashboard.weeklyStats.weeklyCeiling}</span>
          {!isInputVisible ? (
            <button
              type="button"
              disabled={!canEditWeeklyCeiling}
              onClick={() => canEditWeeklyCeiling && setIsInputVisible(true)}
              className={cn(
                "ml-auto inline-flex items-center gap-2 text-cyan-400 text-sm font-medium",
                canEditWeeklyCeiling
                  ? "hover:text-cyan-300 cursor-pointer"
                  : "cursor-not-allowed opacity-50",
              )}
              title="Modifier le plafond"
              aria-label="Modifier le plafond hebdomadaire"
            >
              {canEditWeeklyCeiling && (
                <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <span>{initialCeiling ?? 0} €</span>
            </button>
          ) : (
            <form
              key={initialCeiling}
              onBlur={closeCeilingFormIfFocusLeft}
              onSubmit={handleSubmit(onSubmit)}
              className="ml-auto"
            >
              <Input
                defaultValue={initialCeiling}
                className="w-20 h-7 text-cyan-400 text-sm bg-transparent border-cyan-700"
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Escape") setIsInputVisible(false);
                }}
                autoFocus
                {...register("initialCeiling")}
              />
            </form>
          )}
        </div>

        {weeklyStats && weeklyStats.length > 0 && weeklySlices.length > 0
          ? weeklyStats.map((weekSliceValue: number, i: number) => {
              const ceilingDiff = weekSliceValue - initialCeiling;
              const currentWeek = from ? isCurrentWeek(weeklySlices[i], from) : false;
              const status =
                ceilingDiff <= 0
                  ? "ok"
                  : ceilingDiff > CEILING_WARN_LIMIT
                    ? "danger"
                    : "warn";
              const statusStyles = {
                ok: "bg-emerald-500/20 text-emerald-400",
                warn: "bg-amber-500/20 text-amber-400",
                danger: "bg-rose-500/20 text-rose-400",
              }[status];
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between text-sm",
                    currentWeek && "font-bold",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 w-14 text-xs">
                      {weeklySlices[i]}
                    </span>
                    <span className="text-gray-200">
                      {Number(weekSliceValue).toFixed(2)} €
                    </span>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs inline-flex items-center gap-1",
                      statusStyles,
                    )}
                  >
                    {ceilingDiff > 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {ceilingDiff > 0
                      ? `+${Number(ceilingDiff).toFixed(2)}`
                      : `${Number(Math.abs(ceilingDiff)).toFixed(2)}`}{" "}
                    €
                  </span>
                </div>
              );
            })
          : null}
      </div>

      <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-5 mt-auto shadow-lg shadow-cyan-500/10 flex flex-col justify-center">
        <div className="text-white/90 text-sm font-medium mb-1">
          {spendingsText.dashboard.weeklyStats.weeklySpendings}
        </div>
        <div className="text-white text-3xl lg:text-4xl font-bold mb-3 tracking-tight">
          {Number(averageWeeklyStatsAmount || 0).toFixed(1)} €
        </div>
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
            Moyenne
          </span>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default PeriodSummary;
