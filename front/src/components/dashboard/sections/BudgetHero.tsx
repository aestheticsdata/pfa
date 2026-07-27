"use client";

import EditGlyph from "@components/dashboard/EditGlyph";
import DailySparkline from "@components/dashboard/sections/DailySparkline";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { MoneyAmount } from "@components/shared/MoneyAmount";
import useDashboard from "@components/spendings/services/useDashboard";
import useReccurings from "@components/spendings/services/useReccurings";
import { Input } from "@components/ui/input";
import { Tooltip } from "@components/ui/tooltip";
import { interpolate } from "@i18n/interpolate";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { CategoryTooltipContent, Donut, useCountUp } from "@lib/dataviz";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { BarHover, CategoryTooltipDatum } from "@lib/dataviz";
import type { FocusEvent, KeyboardEvent } from "react";

interface SalaryForm {
  initialAmount: string;
}

/** Hero — remaining budget + fixed/variable gauge + inline salary edit, with the
 *  daily sparkline nested below (single card, per the mockup). */
const BudgetHero = () => {
  const { euro0 } = useFormat();
  const dashboardText = useTranslations("dashboard");
  const dateLocale = useDateLocale();
  const { from } = useDatePickerWrapperStore();
  const {
    get: { data: dashboard },
    mutation,
    remaining,
    monthlyTotal,
  } = useDashboard();
  const { recurrings } = useReccurings();
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState<BarHover<number> | null>(null);
  const { register, handleSubmit, setFocus } = useForm<SalaryForm>();
  const { budgetHero: t } = dashboardText;

  const initialAmount = Number(dashboard?.initialAmount ?? 0);
  const fixed = recurrings?.reduce((a, r) => a + Number(r.amount), 0) ?? 0;
  const variable = Math.max(0, monthlyTotal - fixed);
  const usedPct = initialAmount > 0 ? Math.min(100, (monthlyTotal / initialAmount) * 100) : 0;
  const over = remaining < 0;

  // count both figures up from 0 (mount, data load, month change)
  const animatedPct = useCountUp(usedPct);
  const animatedRemaining = useCountUp(Math.abs(remaining));

  const monthLabel = format(from ?? new Date(), "MMMM yyyy", { locale: dateLocale });
  // remount key → replays the donut grow-from-zero on month change
  const monthKey = format(from ?? new Date(), "yyyy-MM");

  // One source of truth for the two budget segments → the donut arcs AND the
  // hover tooltip render identical values (same order → hover index maps back).
  const budgetSegments =
    initialAmount > 0
      ? [
          { name: t.fixed, value: fixed, color: "var(--accent-d)" },
          { name: t.variables, value: variable, color: "var(--accent-strong)" },
        ]
      : [];
  const segments = budgetSegments.map((s) => ({ label: s.name, value: s.value, color: s.color }));
  // `pct` = share of the whole budget (value / initialAmount), i.e. the fraction
  // of the ring the arc actually occupies post-COS-134 — so the tooltip % matches
  // the hovered arc, not the "% used" of the center.
  const tooltipData: CategoryTooltipDatum[] = budgetSegments.map((s) => ({
    color: s.color,
    name: s.name,
    pct: (s.value / initialAmount) * 100,
    total: s.value,
  }));
  // The empty "available" band (donut reports it as index === segments.length) →
  // the remaining amount and its share of the budget (100 − % used).
  if (initialAmount > 0 && remaining > 0) {
    tooltipData.push({
      color: "var(--accent-strong)",
      name: t.available,
      pct: (remaining / initialAmount) * 100,
      total: remaining,
    });
  }

  const onSubmit = (v: SalaryForm) => {
    setEditing(false);
    mutation.mutate({
      dashboardID: dashboard?.ID,
      initialAmount: v.initialAmount,
    });
  };
  const closeIfLeft = (e: FocusEvent<HTMLFormElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setEditing(false);
  };
  useEffect(() => {
    if (editing) setFocus("initialAmount", { shouldSelect: true });
  }, [editing, setFocus]);

  // Mirror the donut's arc emphasis on the legend: lift the hovered segment's entry,
  // leaving the others untouched (target 2 = the empty "available" band → neither lifts).
  const legendEmphasis = (index: number) => (hover?.target === index ? "brightness-125" : undefined);

  const hoveredDatum = hover ? tooltipData[hover.target] : undefined;

  return (
    <GlowCard
      as="section"
      className="flex flex-col px-7 py-6"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-widest text-ink-3">
            {t.remainingLabel(monthLabel)}
          </span>
          <div
            className={cn(
              "num mt-3.5 text-display font-medium leading-none tracking-tight sm:text-display-lg",
              over ? "text-neg" : "text-ink",
            )}
          >
            {over && "−"}
            <MoneyAmount
              value={animatedRemaining}
              decimalClassName="text-2xl sm:text-4xl"
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-3">
            {!editing ? (
              <span className="inline-flex items-center gap-1.5">
                {interpolate(t.allocated, {
                  amount: (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="group inline-flex items-center gap-1 border-b border-dashed border-ink-4 pb-px leading-tight transition-colors hover:border-accent-strong"
                      aria-label={t.editBudgetAria}
                      title={t.editAmountTitle}
                    >
                      <span className="num text-ink-2">{euro0(initialAmount)} €</span>
                      <EditGlyph className="size-3 text-ink-4 transition-colors group-hover:text-accent-strong" />
                    </button>
                  ),
                })}
              </span>
            ) : (
              <form
                key={dashboard?.ID ?? "new-month"}
                onBlur={closeIfLeft}
                onSubmit={handleSubmit(onSubmit)}
                className="inline-flex items-center gap-1.5"
              >
                {interpolate(t.allocated, {
                  amount: (
                    <>
                      <Input
                        defaultValue={initialAmount}
                        className="num h-7 w-24 border-accent-d bg-surface-base text-ink"
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Escape") setEditing(false);
                        }}
                        autoFocus
                        {...register("initialAmount")}
                      />
                      {" €"}
                    </>
                  ),
                })}
              </form>
            )}

            {initialAmount > 0 ? (
              <>
                <span className="text-ink-4">•</span>
                <span className={over ? "text-neg" : "text-accent-strong"}>{over ? t.overBudget : t.withinBudget}</span>
                <span>{t.atCurrentPace}</span>
              </>
            ) : (
              <>
                <span className="text-ink-4">•</span>
                <span className="text-accent-strong">{t.setBudgetPrompt}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <Donut
            key={monthKey}
            segments={segments}
            capacity={initialAmount}
            size={168}
            thickness={7}
            animate
            ariaLabel={t.donutAria}
            emphasizeOnHover
            onSegmentHover={(index, e) => setHover({ target: index, x: e.clientX, y: e.clientY })}
            onSegmentLeave={() => setHover(null)}
          >
            <div>
              <div className="num text-3xl font-medium leading-none tracking-tight text-ink">
                {Math.round(animatedPct)}
                <span className="text-lg text-ink-3">%</span>
              </div>
              <div className="mt-0.5 text-2xs uppercase tracking-widest text-ink-4">{t.donutUsed}</div>
            </div>
          </Donut>
          <div className="flex gap-4 text-2xs text-ink-3">
            <LegendItem
              className={cn("transition", legendEmphasis(0))}
              swatch={<span className="size-2 rounded-xs bg-accent-d" />}
            >
              {t.fixed} <span className="num text-ink-2">{euro0(fixed)} €</span>
            </LegendItem>
            <LegendItem
              className={cn("transition", legendEmphasis(1))}
              swatch={<span className="size-2 rounded-xs bg-accent-strong" />}
            >
              {t.variables} <span className="num text-ink-2">{euro0(variable)} €</span>
            </LegendItem>
          </div>
        </div>
      </div>

      {/* Rendered unconditionally: the tooltip owns its fade in AND out, so it
          needs to outlive the hover it is fading away from. */}
      <Tooltip
        mode="cursor"
        point={hover && hoveredDatum ? { x: hover.x, y: hover.y } : null}
      >
        {hoveredDatum && <CategoryTooltipContent datum={hoveredDatum} />}
      </Tooltip>

      <DailySparkline />
    </GlowCard>
  );
};

export default BudgetHero;
