"use client";

import { useEffect, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import useDashboard from "@components/spendings/services/useDashboard";
import useReccurings from "@components/spendings/services/useReccurings";
import { Input } from "@components/ui/input";
import { Donut } from "@components/dataviz";
import { euro0, pct1 } from "@components/overview/format";
import { cn } from "@lib/utils";

interface SalaryForm {
  initialAmount: string;
}

/** Hero — remaining budget + fixed/variable gauge + inline salary edit. */
const BudgetHero = () => {
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
  const usedPct =
    initialAmount > 0 ? Math.min(100, (monthlyTotal / initialAmount) * 100) : 0;
  const over = remaining < 0;

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
    <section className="pfa-card flex flex-col gap-6 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-3">
          Budget restant
        </span>
        <div
          className={cn(
            "num text-[52px] font-medium leading-none tracking-[-0.025em]",
            over ? "text-neg" : "text-ink",
          )}
        >
          {euro0(remaining)}
          <span className="text-[34px] font-normal text-ink-3"> €</span>
        </div>
        <div className="group mt-1 flex items-center gap-2 text-[13px] text-ink-3">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
              aria-label="Modifier le budget alloué"
            >
              sur{" "}
              <span className="num text-ink-2">{euro0(initialAmount)} €</span>{" "}
              alloués
              <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
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
        </div>
        <div
          className={cn(
            "mt-1 text-[13px]",
            over ? "text-neg" : "text-accent-strong",
          )}
        >
          {initialAmount <= 0
            ? "Définis ton budget du mois"
            : over
              ? `Dépassement de ${euro0(-remaining)} €`
              : "Dans le budget"}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Donut
          segments={segments}
          size={168}
          thickness={7}
          ariaLabel="Répartition du budget consommé"
        >
          <div>
            <div className="num text-[32px] font-medium leading-none tracking-[-0.02em] text-ink">
              {Math.round(usedPct)}
              <span className="text-[18px] text-ink-3">%</span>
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-4">
              utilisé
            </div>
          </div>
        </Donut>
        <div className="flex gap-4 text-[11px] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-[var(--accent-d)]" />
            Fixes <span className="num text-ink-2">{euro0(fixed)} €</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-accent-strong" />
            Variables{" "}
            <span className="num text-ink-2">{euro0(variable)} €</span>
          </span>
        </div>
        {initialAmount > 0 && (
          <div className="text-[11px] text-ink-4">
            {pct1((monthlyTotal / initialAmount) * 100)}% de {euro0(initialAmount)} €
          </div>
        )}
      </div>
    </section>
  );
};

export default BudgetHero;
