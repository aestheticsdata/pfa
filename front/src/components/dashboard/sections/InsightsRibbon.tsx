"use client";

// Partly MOCK — the pace framing ("~16% moins vite") and the category trend
// ("+X% vs le mois dernier") are placeholders needing real 3-month / prior-month
// history. The end-of-month conclusion, the top category name and "reste à vivre"
// are derived from real data. See REFACTO_NOTES.md §6.

import { euro0 } from "@components/dashboard/format";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { MONTHLY } from "@components/spendings/config/constants";
import dailyRemainingBudget from "@components/spendings/helpers/dailyBudget";
import useCharts from "@components/spendings/services/useCharts";
import useDashboard from "@components/spendings/services/useDashboard";
import { cn } from "@lib/utils";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isSameMonth from "date-fns/isSameMonth";
import fr from "date-fns/locale/fr";
import { TrendingUp, TriangleAlert, Wallet } from "lucide-react";

import type { ReactNode } from "react";

const Insight = ({
  tone,
  icon,
  label,
  children,
}: {
  tone: string;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-3 bg-[var(--bg)] px-[18px] py-3.5">
    <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-[7px]", tone)}>{icon}</span>
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{label}</span>
      <span className="text-[13px] text-ink-2">{children}</span>
    </div>
  </div>
);

const InsightsRibbon = () => {
  const { from } = useDatePickerWrapperStore();
  const {
    remaining,
    monthlyTotal,
    get: { data: dashboard },
  } = useDashboard();
  const { data: charts } = useCharts(MONTHLY);

  const budget = Number(dashboard?.initialAmount ?? 0);
  const now = new Date();
  const monthRef = from ?? now;
  const daysInMonth = getDaysInMonth(monthRef);
  const isThisMonth = isSameMonth(monthRef, now);
  const dayOfMonth = isThisMonth ? getDate(now) : daysInMonth;
  const projection = dayOfMonth > 0 ? (monthlyTotal / dayOfMonth) * daysInMonth : monthlyTotal;
  const underBudget = budget <= 0 || projection <= budget;
  // same figure as the Dépenses "Budget du jour maximum" (shared helper)
  const perDay = dailyRemainingBudget(remaining, isThisMonth ? now : endOfMonth(monthRef));
  const topCategory = (charts ?? []).slice().sort((a, b) => b.value - a.value)[0]?.category;
  const lastDayLabel = format(endOfMonth(monthRef), "d MMMM", { locale: fr });

  return (
    <section className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-line-soft bg-line-soft sm:grid-cols-3">
      <Insight
        tone="bg-accent-strong/10 text-accent-strong"
        icon={<TrendingUp className="size-3.5" />}
        label="Sur le rythme"
      >
        Tu consommes <b className="font-semibold text-ink">~16% moins vite</b> {/* MOCK pace */}que ta moyenne 3 mois. À
        ce rythme, tu termines le mois{" "}
        <b className="font-semibold text-ink">{underBudget ? "sous ton budget" : "au-dessus de ton budget"}</b>.
      </Insight>
      <Insight
        tone="bg-neg/10 text-neg"
        icon={<TriangleAlert className="size-3.5" />}
        label="Catégorie en hausse"
      >
        {topCategory ? (
          <>
            <b className="font-semibold capitalize text-ink">{topCategory}</b> à{" "}
            <b className="num font-semibold text-ink">+24%</b> {/* MOCK trend */}
            vs le mois dernier.
          </>
        ) : (
          "Aucune catégorie ce mois."
        )}
      </Insight>
      <Insight
        tone="bg-bg-hi text-ink-2"
        icon={<Wallet className="size-3.5" />}
        label="Reste à vivre"
      >
        Il te reste <b className="num font-semibold text-ink">{euro0(perDay)} €</b>
        /jour à dépenser d&apos;ici le <b className="font-semibold text-ink">{lastDayLabel}</b> pour rester dans ton
        budget.
      </Insight>
    </section>
  );
};

export default InsightsRibbon;
