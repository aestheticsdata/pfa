"use client";

import { useEffect, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import useWeeklyStats from "@components/spendings/services/useWeeklyStats";
import useWeeklyStatsHelper from "@components/spendings/spendingDashboard/weeklyStats/helpers/useWeeklyStatsHelper";
import { Input } from "@components/ui/input";
import { ProgressTrack } from "@components/dataviz";
import { euro, euro0 } from "@components/overview/format";
import { cn } from "@lib/utils";

interface CeilingForm {
  initialCeiling: string;
}

/** Weekly spend vs a fixed ceiling, per week of the month + inline ceiling edit. */
const WeeklyCeiling = () => {
  const { from } = useDatePickerWrapperStore();
  const { makeSlices, makeRange, isCurrentWeek } = useWeeklyStatsHelper();
  const {
    get: { data: weeklyStats, error: wsError },
    mutation,
  } = useWeeklyStats();
  const {
    get: { data: dashboard, error: dbError },
  } = useDashboard();
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, setFocus } = useForm<CeilingForm>();

  if (wsError) throw wsError;
  if (dbError) throw dbError;

  const ceiling = dashboard ? Number(dashboard.initialCeiling) : 0;
  const slices = from ? makeSlices(makeRange(from)) : [];
  const stats = weeklyStats ?? [];
  const nonZero = stats.filter(Boolean);
  const avg = nonZero.length
    ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length
    : 0;
  const scaleMax = ceiling > 0 ? ceiling * 3 : Math.max(1, ...stats);
  const canEdit = dashboard != null;

  const onSubmit = (v: CeilingForm) => {
    setEditing(false);
    mutation.mutate(v.initialCeiling);
  };
  const closeIfLeft = (e: FocusEvent<HTMLFormElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setEditing(false);
  };
  useEffect(() => {
    if (editing) setFocus("initialCeiling", { shouldSelect: true });
  }, [editing, setFocus]);

  return (
    <section className="pfa-card flex flex-col gap-4 px-6 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Plafond hebdomadaire
        </h2>
        {!editing ? (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => canEdit && setEditing(true)}
            className={cn(
              "group inline-flex items-center gap-1.5 text-sm",
              canEdit ? "text-ink-2 hover:text-ink" : "opacity-50",
            )}
            title="Modifier le plafond"
          >
            {canEdit && (
              <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
            <span className="num">{euro0(ceiling)} € / sem.</span>
          </button>
        ) : (
          <form key={ceiling} onBlur={closeIfLeft} onSubmit={handleSubmit(onSubmit)}>
            <Input
              defaultValue={ceiling}
              className="num h-7 w-24 border-accent-d bg-background text-ink"
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
              {...register("initialCeiling")}
            />
          </form>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {stats.map((weekTotal, i) => {
          const current = from ? isCurrentWeek(slices[i], from) : false;
          const over = ceiling > 0 && weekTotal > ceiling;
          return (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[64px_1fr_auto] items-center gap-3 text-sm",
                current && "font-semibold",
              )}
            >
              <span className="num text-xs text-ink-3">
                {slices[i] ?? `S${i + 1}`}
              </span>
              <ProgressTrack
                value={weekTotal}
                max={scaleMax}
                ceiling={ceiling > 0 ? ceiling : undefined}
                height={5}
                radius={3}
              />
              <span
                className={cn(
                  "num min-w-[64px] text-right text-[13px]",
                  over ? "text-neg" : "text-ink",
                )}
              >
                {euro(weekTotal)} €
              </span>
            </div>
          );
        })}
        {stats.length === 0 && (
          <div className="py-6 text-center text-[12.5px] text-ink-4">
            Pas encore de données.
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-3 text-[12.5px] text-ink-3">
        <span>Moyenne</span>
        <span className="num text-ink">
          {euro(avg)} €
          {ceiling > 0 && (
            <span className="text-ink-4">
              {" "}
              · {Math.round((avg / ceiling) * 100)}% du plafond
            </span>
          )}
        </span>
      </div>
    </section>
  );
};

export default WeeklyCeiling;
