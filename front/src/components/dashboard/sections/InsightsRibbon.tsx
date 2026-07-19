"use client";

// Partly MOCK — the pace framing ("~16% moins vite") is still a placeholder
// needing real 3-month history. The end-of-month conclusion, the rising category
// (name + real % vs last month) and "reste à vivre" are derived from real data.
// See REFACTO_NOTES.md §6.

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DividedStrip } from "@components/shared/DividedStrip";
import { Overline } from "@components/shared/Overline";
import { MONTHLY } from "@components/spendings/config/constants";
import { categoryDeltaPct, STABLE_TREND_THRESHOLD } from "@components/spendings/helpers/categoryTrend";
import dailyRemainingBudget from "@components/spendings/helpers/dailyBudget";
import useCategoryTrends from "@components/spendings/services/useCategoryTrends";
import useDashboard from "@components/spendings/services/useDashboard";
import { euro0 } from "@lib/format";
import { cn } from "@lib/utils";
import dashboardText from "@text/dashboard";
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
  <div className="flex items-start gap-3 bg-card px-4.5 py-3.5">
    <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md", tone)}>{icon}</span>
    <div className="flex flex-col gap-0.5">
      <Overline className="text-ink-3">{label}</Overline>
      <span className="text-sm text-ink-2">{children}</span>
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
  const { data: trends } = useCategoryTrends(MONTHLY);
  const { insightsRibbon: t } = dashboardText;

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
  // The named category whose spending rose the most vs last month. Gated on the
  // same threshold as the breakdown's trend badge, so a rise the list still shows
  // as "stable" is never headlined here. New/uncategorized categories are skipped.
  const topRiser = (trends ?? [])
    .flatMap((c) => {
      const delta = categoryDeltaPct(c.value, c.previousValue);
      return c.category != null && delta != null && delta >= STABLE_TREND_THRESHOLD
        ? [{ category: c.category, delta }]
        : [];
    })
    .sort((a, b) => b.delta - a.delta)[0];
  const lastDayLabel = format(endOfMonth(monthRef), "d MMMM", { locale: fr });

  return (
    <DividedStrip className="grid-cols-1 sm:grid-cols-3">
      <Insight
        tone="bg-accent-strong/10 text-accent-strong"
        icon={<TrendingUp className="size-3.5" />}
        label={t.paceLabel}
      >
        Consommation <b className="font-semibold text-ink">~16% moins vite</b> {/* MOCK pace */}que la moyenne 3 mois. À
        ce rythme, le mois se termine{" "}
        <b className="font-semibold text-ink">{underBudget ? "sous le budget" : "au-dessus du budget"}</b>.
      </Insight>
      <Insight
        tone="bg-neg/10 text-neg"
        icon={<TriangleAlert className="size-3.5" />}
        label={t.risingLabel}
      >
        {topRiser ? (
          <>
            <b className="font-semibold capitalize text-ink">{topRiser.category}</b> à{" "}
            <b className="num font-semibold text-ink">+{Math.round(topRiser.delta)}%</b> vs le mois dernier.
          </>
        ) : (
          t.risingEmpty
        )}
      </Insight>
      <Insight
        tone="bg-surface-hi text-ink-2"
        icon={<Wallet className="size-3.5" />}
        label={t.remainingLabel}
      >
        Il reste <b className="num font-semibold text-ink">{euro0(perDay)} €</b>
        /jour à dépenser d&apos;ici le <b className="font-semibold text-ink">{lastDayLabel}</b> pour rester dans le
        budget.
      </Insight>
    </DividedStrip>
  );
};

export default InsightsRibbon;
