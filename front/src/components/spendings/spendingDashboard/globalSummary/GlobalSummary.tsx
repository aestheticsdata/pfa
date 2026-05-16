"use client";

import { useEffect, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import useDashboard from "@components/spendings/services/useDashboard";
import { SurfaceCard } from "@components/ui/surface-card";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import spendingsText from "@components/spendings/config/text";

interface InitialSalary {
  initialAmount: string;
}

const GlobalSummary = () => {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const {
    get: { data: dashboard, error: dashboardError },
    mutation,
    remaining,
    monthlyTotal,
  } = useDashboard();
  const { register, handleSubmit, setFocus } = useForm<InitialSalary>();

  if (dashboardError) {
    throw dashboardError;
  }

  const initialAmount = Number(dashboard?.initialAmount ?? 0);
  const labels = spendingsText.dashboard.monthlyBudget;
  const remainingColor =
    remaining < 0 ? "text-red-400" : "text-cyan-400";

  const onSubmit = (value: InitialSalary) => {
    setIsInputVisible(false);
    mutation.mutate({
      dashboardID: dashboard?.ID,
      initialAmount: value.initialAmount,
    });
  };

  const closeFormIfFocusLeft = (e: FocusEvent<HTMLFormElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) {
      return;
    }
    setIsInputVisible(false);
  };

  useEffect(() => {
    if (isInputVisible) {
      setFocus("initialAmount", { shouldSelect: true });
    }
  }, [setFocus, isInputVisible]);

  return (
    <SurfaceCard
      padding="lg"
      className="flex flex-col md:flex-row justify-between items-stretch gap-0"
    >
      <div className="w-full md:flex-1 text-center md:border-r border-gray-800/50 px-2 py-2 group">
        <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider whitespace-nowrap">
          {labels.initialAmount}
        </div>
        {!isInputVisible ? (
          <button
            type="button"
            onClick={() => setIsInputVisible(true)}
            className="relative inline-flex items-center text-cyan-400 text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-light leading-none whitespace-nowrap hover:text-cyan-300 transition-colors cursor-pointer"
            aria-label="Modifier le montant initial"
          >
            <span>{Math.round(initialAmount)} €</span>
            <Pencil className="absolute left-full top-1/2 ml-2 -translate-y-1/2 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <form
            key={dashboard?.ID ?? "new-month"}
            onBlur={closeFormIfFocusLeft}
            onSubmit={handleSubmit(onSubmit)}
            className="flex justify-center"
          >
            <Input
              defaultValue={initialAmount}
              className="w-32 text-center text-cyan-400 text-2xl font-light bg-transparent border-cyan-700"
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Escape") setIsInputVisible(false);
              }}
              autoFocus
              {...register("initialAmount")}
            />
          </form>
        )}
      </div>

      <div className="w-full md:flex-1 text-center md:border-r border-gray-800/50 px-2 py-2">
        <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider whitespace-nowrap">
          {labels.total}
        </div>
        <div className="text-gray-100 text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-light leading-none whitespace-nowrap">
          {Math.round(monthlyTotal)} €
        </div>
      </div>

      <div className="w-full md:flex-1 text-center px-2 py-2">
        <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider whitespace-nowrap">
          {labels.remaining}
        </div>
        <div
          className={cn(
            "text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-bold leading-none whitespace-nowrap drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]",
            remainingColor,
          )}
        >
          {Math.round(remaining)} €
        </div>
      </div>
    </SurfaceCard>
  );
};

export default GlobalSummary;
