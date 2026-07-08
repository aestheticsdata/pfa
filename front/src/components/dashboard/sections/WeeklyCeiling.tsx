"use client";

import { useEffect, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import getDate from "date-fns/getDate";
import startOfMonth from "date-fns/startOfMonth";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import format from "date-fns/format";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import useWeeklyStats from "@components/spendings/services/useWeeklyStats";
import useWeeklyStatsHelper from "@components/spendings/helpers/useWeeklyStatsHelper";
import { Input } from "@components/ui/input";
import { ProgressTrack } from "@lib/dataviz";
import EditGlyph from "@components/dashboard/EditGlyph";
import { euro, euro0 } from "@components/dashboard/format";
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

  const now = new Date();
  const ceiling = dashboard ? Number(dashboard.initialCeiling) : 0;
  const slices = from ? makeSlices(makeRange(from)) : [];
  const stats = weeklyStats ?? [];
  const nonZero = stats.filter(Boolean);
  const avg = nonZero.length
    ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length
    : 0;
  const scaleMax = ceiling > 0 ? ceiling * 3 : Math.max(1, ...stats);
  const canEdit = dashboard != null;
  // remount key → replays the bar grow-from-zero on month change / data load
  const monthKey = from ? format(from, "yyyy-MM") : "none";

  const monthIsFuture = from
    ? isAfter(startOfMonth(from), startOfMonth(now))
    : false;
  const monthIsPast = from
    ? isBefore(startOfMonth(from), startOfMonth(now))
    : false;

  const isFutureWeek = (slice: string | number): boolean => {
    if (monthIsFuture) return true;
    if (monthIsPast) return false;
    const startDay =
      typeof slice === "number" ? slice : parseInt(String(slice), 10);
    return Number.isFinite(startDay) && startDay > getDate(now);
  };

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
              "group inline-flex items-center gap-1 border-b border-dashed pb-px text-[12px] transition-colors",
              canEdit
                ? "border-ink-4 text-ink-2 hover:border-accent-strong"
                : "border-transparent opacity-50",
            )}
            title="Modifier le plafond"
          >
            <span className="num">{euro0(ceiling)} €/sem.</span>
            {canEdit && (
              <EditGlyph className="size-[11px] text-ink-4 transition-colors group-hover:text-accent-strong" />
            )}
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

      <div className="flex flex-col">
        {stats.map((weekTotal, i) => {
          const current = from ? isCurrentWeek(slices[i], from) : false;
          const over = ceiling > 0 && weekTotal > ceiling;
          const future = isFutureWeek(slices[i]);
          const delta = weekTotal - ceiling;
          return (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[52px_1fr_74px] items-center gap-3 border-b border-line-soft py-[11px] text-[13px] last:border-b-0",
                current && "font-semibold",
              )}
            >
              <span className="num text-[12px] text-ink-2">
                {slices[i] ?? `S${i + 1}`}
              </span>
              <ProgressTrack
                key={`${monthKey}-${i}-${weekTotal > 0 ? "d" : "e"}`}
                value={weekTotal}
                max={scaleMax}
                ceiling={ceiling > 0 ? ceiling : undefined}
                height={5}
                radius={3}
                className="mx-1"
                animate
                animationDelay={i * 0.07}
              />
              <span className="text-right">
                <span
                  className={cn(
                    "num block font-medium",
                    over ? "text-neg" : "text-ink",
                  )}
                >
                  {future ? "—" : `${euro(weekTotal)} €`}
                </span>
                {future ? (
                  <span className="block text-[11px] text-ink-4">à venir</span>
                ) : (
                  ceiling > 0 && (
                    <span
                      className={cn(
                        "num block text-[11px]",
                        delta > 0 ? "text-neg" : "text-accent-strong",
                      )}
                    >
                      {delta > 0 ? `+${euro0(delta)} €` : `${euro0(delta)} €`}
                    </span>
                  )
                )}
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

      <div className="flex items-center justify-between border-t border-line pt-3.5 text-[12px] text-ink-3">
        <span>Moyenne hebdo</span>
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

      {ceiling > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink-3">
          <span className="inline-block h-2.5 w-0.5 rounded-sm bg-ink-2" />
          <span className="num">Plafond {euro0(ceiling)} €</span>
          <span className="text-ink-4">·</span>
          <span
            className="inline-block size-2.5 rounded-[2px]"
            style={{ background: "var(--accent-strong)", opacity: 0.92 }}
          />
          dans le budget
          <span className="text-ink-4">·</span>
          <span
            className="inline-block size-2.5 rounded-[2px]"
            style={{ background: "var(--neg)", opacity: 0.95 }}
          />
          dépassement
        </div>
      )}
    </section>
  );
};

export default WeeklyCeiling;
