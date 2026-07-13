"use client";

import EditGlyph from "@components/dashboard/EditGlyph";
import { euro, euro0 } from "@components/dashboard/format";
import DailySparkline from "@components/dashboard/sections/DailySparkline";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import useReccurings from "@components/spendings/services/useReccurings";
import { Input } from "@components/ui/input";
import { Donut, useCountUp } from "@lib/dataviz";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { FocusEvent, KeyboardEvent } from "react";

interface SalaryForm {
  initialAmount: string;
}

/** Hero — remaining budget + fixed/variable gauge + inline salary edit, with the
 *  daily sparkline nested below (single card, per the mockup). */
const BudgetHero = () => {
  const { from } = useDatePickerWrapperStore();
  const {
    get: { data: dashboard, error },
    mutation,
    remaining,
    monthlyTotal,
  } = useDashboard();
  const { recurrings } = useReccurings();
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, setFocus } = useForm<SalaryForm>();

  if (error) {
    throw error;
  }

  const initialAmount = Number(dashboard?.initialAmount ?? 0);
  const fixed = recurrings?.reduce((a, r) => a + Number(r.amount), 0) ?? 0;
  const variable = Math.max(0, monthlyTotal - fixed);
  const usedPct = initialAmount > 0 ? Math.min(100, (monthlyTotal / initialAmount) * 100) : 0;
  const over = remaining < 0;

  // count both figures up from 0 (mount, data load, month change)
  const animatedPct = useCountUp(usedPct);
  const animatedRemaining = useCountUp(Math.abs(remaining));

  const monthLabel = format(from ?? new Date(), "MMMM yyyy", { locale: fr });
  // remount key → replays the donut grow-from-zero on month change
  const monthKey = format(from ?? new Date(), "yyyy-MM");
  const [amountInt, amountDec] = euro(animatedRemaining).split(",");

  const segments =
    initialAmount > 0
      ? [
          { label: "Fixes", value: fixed, color: "var(--accent-d)" },
          { label: "Variables", value: variable, color: "var(--accent-strong)" },
        ]
      : [];

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

  return (
    <section className="pfa-card flex flex-col px-7 py-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-3">
            {monthLabel} — budget restant
          </span>
          <div
            className={cn(
              "num mt-3.5 text-[40px] font-medium leading-none tracking-[-0.025em] sm:text-[56px]",
              over ? "text-neg" : "text-ink",
            )}
          >
            {over && "−"}
            {amountInt}
            <span className="text-[26px] font-normal text-ink-3 sm:text-[36px]">,{amountDec} €</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-3">
            {!editing ? (
              <span className="inline-flex items-center gap-1.5">
                sur
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="group inline-flex items-center gap-1 border-b border-dashed border-ink-4 pb-px leading-tight transition-colors hover:border-accent-strong"
                  aria-label="Modifier le budget alloué"
                  title="Modifier le montant initial"
                >
                  <span className="num text-ink-2">{euro0(initialAmount)} €</span>
                  <EditGlyph className="size-[11px] text-ink-4 transition-colors group-hover:text-accent-strong" />
                </button>
                alloués
              </span>
            ) : (
              <form
                key={dashboard?.ID ?? "new-month"}
                onBlur={closeIfLeft}
                onSubmit={handleSubmit(onSubmit)}
                className="inline-flex items-center gap-1.5"
              >
                sur
                <Input
                  defaultValue={initialAmount}
                  className="num h-7 w-24 border-accent-d bg-background text-ink"
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Escape") setEditing(false);
                  }}
                  autoFocus
                  {...register("initialAmount")}
                />
                € alloués
              </form>
            )}

            {initialAmount > 0 ? (
              <>
                <span className="text-ink-4">•</span>
                <span className={over ? "text-neg" : "text-accent-strong"}>
                  {over ? "↓ au-dessus du budget" : "↑ dans le budget"}
                </span>
                <span>au rythme actuel</span>
              </>
            ) : (
              <>
                <span className="text-ink-4">•</span>
                <span className="text-accent-strong">Définis ton budget du mois</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <Donut
            key={monthKey}
            segments={segments}
            size={168}
            thickness={7}
            animate
            ariaLabel="Répartition du budget consommé"
          >
            <div>
              <div className="num text-[32px] font-medium leading-none tracking-[-0.02em] text-ink">
                {Math.round(animatedPct)}
                <span className="text-[18px] text-ink-3">%</span>
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-4">utilisé</div>
            </div>
          </Donut>
          <div className="flex gap-4 text-[11px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-[2px] bg-[var(--accent-d)]" />
              Fixes <span className="num text-ink-2">{euro0(fixed)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-[2px] bg-accent-strong" />
              Variables <span className="num text-ink-2">{euro0(variable)}</span>
            </span>
          </div>
        </div>
      </div>

      <DailySparkline />
    </section>
  );
};

export default BudgetHero;
