"use client";

// All four insights are derived from real data: the pace vs the preceding
// months' daily average and the end-of-month budget conclusion (COS-40), the top
// rising category (name + real % vs last month), "reste à vivre", and the
// busiest week.

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DividedStrip } from "@components/shared/DividedStrip";
import { Overline } from "@components/shared/Overline";
import { MONTHLY } from "@components/spendings/config/constants";
import { categoryDeltaPct, STABLE_TREND_THRESHOLD } from "@components/spendings/helpers/categoryTrend";
import dailyRemainingBudget from "@components/spendings/helpers/dailyBudget";
import { spendingPaceDelta } from "@components/spendings/helpers/spendingPace";
import useBusiestWeek from "@components/spendings/services/useBusiestWeek";
import useCategoryTrends from "@components/spendings/services/useCategoryTrends";
import useDashboard from "@components/spendings/services/useDashboard";
import useSpendingPace from "@components/spendings/services/useSpendingPace";
import { buildSpendingsPath } from "@helpers/dateRoute";
import { euro0 } from "@lib/format";
import { cn } from "@lib/utils";
import dashboardText from "@text/dashboard";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isSameMonth from "date-fns/isSameMonth";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";
import { ArrowRightLeft, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import Link from "next/link";

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
  const { data: trendsData } = useCategoryTrends(MONTHLY);
  const trends = trendsData?.trends;
  const { data: busiest } = useBusiestWeek();
  const { data: pace } = useSpendingPace();
  const { insightsRibbon: t } = dashboardText;

  const budget = Number(dashboard?.initialAmount ?? 0);
  const now = new Date();
  const monthRef = from ?? now;
  const daysInMonth = getDaysInMonth(monthRef);
  const isThisMonth = isSameMonth(monthRef, now);
  const dayOfMonth = isThisMonth ? getDate(now) : daysInMonth;
  const projection = dayOfMonth > 0 ? (monthlyTotal / dayOfMonth) * daysInMonth : monthlyTotal;
  const underBudget = budget <= 0 || projection <= budget;
  // The budget line is a forecast only while the month is still running; on its
  // last day and for past months there are no days left to project, so it reads
  // as a bilan instead ("projection" then equals the month's actual total).
  const inProgress = isThisMonth && dayOfMonth < daysInMonth;
  const budgetLead = inProgress
    ? "À ce rythme, le mois se termine"
    : isThisMonth
      ? "Le mois se termine aujourd'hui,"
      : "Le mois s'est terminé";
  // Real pace vs the preceding months' daily average (COS-40); null when there is
  // not enough to compare (no prior month with spending, or too few days elapsed
  // this month), in which case we show a waiting note instead of a figure.
  const paceComparison = spendingPaceDelta(monthlyTotal, dayOfMonth, pace?.months ?? []);
  const paceDelta = paceComparison ? Math.round(Math.abs(paceComparison.deltaPct)) : 0;
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
  // The month's calendar week-range with the most transactions (COS-139); from/to
  // come back as ISO strings — parseISO keeps them on the client's calendar day.
  const busiestRange =
    busiest && busiest.count > 0 && busiest.from && busiest.to
      ? { count: busiest.count, fromIso: busiest.from, from: parseISO(busiest.from), to: parseISO(busiest.to) }
      : null;

  return (
    <DividedStrip className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Insight
        tone="bg-accent-strong/10 text-accent-strong"
        icon={<TrendingUp className="size-3.5" />}
        label={t.paceLabel}
      >
        {paceComparison ? (
          <>
            Consommation{" "}
            <b className="font-semibold text-ink">
              {paceDelta === 0
                ? "au même rythme"
                : `~${paceDelta}% ${paceComparison.faster ? "plus vite" : "moins vite"}`}
            </b>{" "}
            que la moyenne 3 mois.{" "}
          </>
        ) : (
          <>{t.paceEmpty} </>
        )}
        {budgetLead} <b className="font-semibold text-ink">{underBudget ? "sous le budget" : "au-dessus du budget"}</b>.
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
      <Insight
        tone="bg-surface-hi text-ink-2"
        icon={<ArrowRightLeft className="size-3.5" />}
        label={t.busiestLabel}
      >
        {busiestRange ? (
          <>
            <b className="num font-semibold text-ink">
              {busiestRange.count} transaction{busiestRange.count > 1 ? "s" : ""}
            </b>{" "}
            du{" "}
            <Link
              href={buildSpendingsPath(busiestRange.fromIso)}
              className="cursor-pointer font-semibold text-ink underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
            >
              {format(busiestRange.from, "d", { locale: fr })} au {format(busiestRange.to, "d MMMM", { locale: fr })}
            </Link>
            .
          </>
        ) : (
          t.busiestEmpty
        )}
      </Insight>
    </DividedStrip>
  );
};

export default InsightsRibbon;
