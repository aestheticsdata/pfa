"use client";

import EditGlyph from "@components/dashboard/EditGlyph";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import { EmptyState } from "@components/shared/EmptyState";
import GlowCard from "@components/shared/GlowCard";
import useWeeklyStatsHelper from "@components/spendings/helpers/useWeeklyStatsHelper";
import useDashboard from "@components/spendings/services/useDashboard";
import useWeeklyStats from "@components/spendings/services/useWeeklyStats";
import { Input } from "@components/ui/input";
import { buildSpendingsPath, formatIsoDate } from "@helpers/dateRoute";
import { ProgressTrack } from "@lib/dataviz";
import { euro, euro0 } from "@lib/format";
import { cn } from "@lib/utils";
import dashboardText from "@text/dashboard";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import startOfMonth from "date-fns/startOfMonth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { FocusEvent, KeyboardEvent } from "react";

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
  const { weeklyCeiling: t } = dashboardText;

  if (wsError) throw wsError;
  if (dbError) throw dbError;

  const now = new Date();
  const ceiling = dashboard ? Number(dashboard.initialCeiling) : 0;
  const slices = from ? makeSlices(makeRange(from)) : [];
  const stats = weeklyStats ?? [];
  const nonZero = stats.filter(Boolean);
  const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
  const scaleMax = ceiling > 0 ? ceiling * 3 : Math.max(1, ...stats);
  const canEdit = dashboard != null;
  // remount key → replays the bar grow-from-zero on month change / data load
  const monthKey = from ? format(from, "yyyy-MM") : "none";

  const monthIsFuture = from ? isAfter(startOfMonth(from), startOfMonth(now)) : false;
  const monthIsPast = from ? isBefore(startOfMonth(from), startOfMonth(now)) : false;

  const isFutureWeek = (slice: string | number): boolean => {
    if (monthIsFuture) return true;
    if (monthIsPast) return false;
    const startDay = typeof slice === "number" ? slice : parseInt(String(slice), 10);
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
    <GlowCard
      as="section"
      className="flex flex-col gap-4 px-6 py-5"
    >
      <CardSectionHeader
        title={t.title}
        className="items-center"
        action={
          !editing ? (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => canEdit && setEditing(true)}
              className={cn(
                "group inline-flex items-center gap-1 border-b border-dashed pb-px text-xs transition-colors",
                canEdit ? "border-ink-4 text-ink-2 hover:border-accent-strong" : "border-transparent opacity-50",
              )}
              title={t.editTitle}
            >
              <span className="num">{euro0(ceiling)} €/sem.</span>
              {canEdit && <EditGlyph className="size-3 text-ink-4 transition-colors group-hover:text-accent-strong" />}
            </button>
          ) : (
            <form
              key={ceiling}
              onBlur={closeIfLeft}
              onSubmit={handleSubmit(onSubmit)}
            >
              <Input
                defaultValue={ceiling}
                className="num h-7 w-24 border-accent-d bg-surface-base text-ink"
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                {...register("initialCeiling")}
              />
            </form>
          )
        }
      />

      <div className="flex flex-col">
        {stats.map((weekTotal, i) => {
          const weekLabel = slices[i] ?? `S${i + 1}`;
          const current = from ? isCurrentWeek(slices[i], from) : false;
          const over = ceiling > 0 && weekTotal > ceiling;
          const future = isFutureWeek(slices[i]);
          const delta = weekTotal - ceiling;
          // Past/current weeks drill into that week on the Dépenses page; future
          // weeks have nothing to open, so they stay inert — no link, no hover,
          // default cursor (COS-151). Start day of the range doubles as the ?date=.
          const startDay = typeof weekLabel === "number" ? weekLabel : parseInt(String(weekLabel), 10);
          const href =
            !future && from != null && Number.isFinite(startDay)
              ? buildSpendingsPath(formatIsoDate(new Date(from.getFullYear(), from.getMonth(), startDay)))
              : null;
          const rowClass = cn(
            "grid grid-cols-[52px_1fr_74px] items-center gap-3 border-b border-line-soft py-3 text-sm last:border-b-0",
            current && "font-semibold",
          );
          const cells = (
            <>
              <span className="num text-xs text-ink-2">{slices[i] ?? `S${i + 1}`}</span>
              <ProgressTrack
                key={`${monthKey}-${weekLabel}-${weekTotal > 0 ? "d" : "e"}`}
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
                <span className={cn("num block font-medium", over ? "text-neg" : "text-ink")}>
                  {future ? "—" : `${euro(weekTotal)} €`}
                </span>
                {future ? (
                  <span className="block text-2xs text-ink-4">{t.upcoming}</span>
                ) : (
                  ceiling > 0 && (
                    <span className={cn("num block text-2xs", delta > 0 ? "text-neg" : "text-accent-strong")}>
                      {delta > 0 ? `+${euro0(delta)} €` : `${euro0(delta)} €`}
                    </span>
                  )
                )}
              </span>
            </>
          );
          return href ? (
            <Link
              key={`${monthKey}-${weekLabel}`}
              href={href}
              className={cn(
                rowClass,
                "-mx-2 cursor-pointer rounded-md px-2 transition-colors duration-100 hover:bg-surface-hi",
              )}
            >
              {cells}
            </Link>
          ) : (
            <div
              key={`${monthKey}-${weekLabel}`}
              className={rowClass}
            >
              {cells}
            </div>
          );
        })}
        {stats.length === 0 && <EmptyState>{t.empty}</EmptyState>}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3.5 text-xs text-ink-3">
        <span>{t.avgLabel}</span>
        <span className="num text-ink">
          {euro(avg)} €
          {ceiling > 0 && <span className="text-ink-4"> · {t.pctOfCeiling(Math.round((avg / ceiling) * 100))}</span>}
        </span>
      </div>

      {ceiling > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-2xs text-ink-3">
          <span className="inline-block h-2.5 w-0.5 rounded-sm bg-ink-2" />
          <span className="num">{t.ceilingAmount(euro0(ceiling))}</span>
          <span className="text-ink-4">·</span>
          <span
            className="inline-block size-2.5 rounded-xs"
            style={{ background: "var(--accent-strong)", opacity: 0.92 }}
          />
          {t.withinBudget}
          <span className="text-ink-4">·</span>
          <span
            className="inline-block size-2.5 rounded-xs"
            style={{ background: "var(--neg)", opacity: 0.95 }}
          />
          {t.overrun}
        </div>
      )}
    </GlowCard>
  );
};

export default WeeklyCeiling;
