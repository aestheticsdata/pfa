"use client";

// All four insights are derived from real data: the pace vs the preceding
// months' daily average and the end-of-month budget conclusion (COS-40), the top
// rising category (name + real % vs last month), "Left to spend", and the
// busiest week.

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DividedStrip } from "@components/shared/DividedStrip";
import { Overline } from "@components/shared/Overline";
import { MONTHLY } from "@components/spendings/config/constants";
import { categoryDeltaPct, STABLE_TREND_THRESHOLD } from "@components/spendings/helpers/categoryTrend";
import dailyRemainingBudget from "@components/spendings/helpers/dailyBudget";
import { projectedOverBudget } from "@components/spendings/helpers/endOfMonthProjection";
import overspendLevel from "@components/spendings/helpers/overspendLevel";
import { spendingPaceDelta } from "@components/spendings/helpers/spendingPace";
import useBusiestWeek from "@components/spendings/services/useBusiestWeek";
import useCategoryTrends from "@components/spendings/services/useCategoryTrends";
import useDashboard from "@components/spendings/services/useDashboard";
import useEndOfMonthProjection from "@components/spendings/services/useEndOfMonthProjection";
import useSpendingPace from "@components/spendings/services/useSpendingPace";
import { buildSpendingsPath } from "@helpers/dateRoute";
import { interpolate } from "@i18n/interpolate";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isBefore from "date-fns/isBefore";
import isSameMonth from "date-fns/isSameMonth";
import parseISO from "date-fns/parseISO";
import startOfMonth from "date-fns/startOfMonth";
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
  const { euro0 } = useFormat();
  const dashboardText = useTranslations("dashboard");
  const dateLocale = useDateLocale();
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
  const { projection } = useEndOfMonthProjection();
  const { insightsRibbon: t } = dashboardText;

  const budget = Number(dashboard?.initialAmount ?? 0);
  const now = new Date();
  const monthRef = from ?? now;
  const daysInMonth = getDaysInMonth(monthRef);
  const isThisMonth = isSameMonth(monthRef, now);
  const isPastMonth = isBefore(startOfMonth(monthRef), startOfMonth(now));
  // Days elapsed in the VIEWED month: up to today for the current one, the whole
  // of a past (complete) one, none for a month that has not started — handing a
  // future month its full length as "elapsed" would fabricate a daily rate.
  const dayOfMonth = isThisMonth ? getDate(now) : isPastMonth ? daysInMonth : 0;
  // Shared with the forecast strip and the hero, so the three cards can never
  // reach opposite conclusions about the same month (PFA-175). Null = nothing to
  // conclude (no reference period, or no budget set) → the sentence stays off.
  const overBudget = projectedOverBudget(projection, budget);
  // The budget line is a forecast only while the month is still running; on its
  // last day and for past months there are no days left to project, so it reads
  // as a summary instead ("projection" then equals the month's actual total).
  const inProgress = isThisMonth && dayOfMonth < daysInMonth;
  const budgetOutcome = inProgress
    ? t.budgetOutcomeInProgress
    : isThisMonth
      ? t.budgetOutcomeLastDay
      : t.budgetOutcomePast;
  // Real pace vs the preceding months' daily average (COS-40); null when there is
  // not enough to compare (no prior month with spending, or too few days elapsed
  // this month), in which case we show a waiting note instead of a figure.
  const paceComparison = spendingPaceDelta(monthlyTotal, dayOfMonth, pace?.months ?? []);
  const paceDelta = paceComparison ? Math.round(Math.abs(paceComparison.deltaPct)) : 0;
  // same figure as the Spendings "Maximum daily budget" (shared helper)
  const perDay = dailyRemainingBudget(remaining, isThisMonth ? now : endOfMonth(monthRef));
  // Colour of the finished-month leftover: green while it closed with money left,
  // then amber → red as the overspend deepens (shared OVERSPEND_DANGER_RATIO).
  const balanceLevel = overspendLevel(monthlyTotal, budget);
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
  const lastDayLabel = format(endOfMonth(monthRef), "d MMMM", { locale: dateLocale });
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
        {paceComparison
          ? interpolate(t.paceSentence, {
              pace: (
                <b className="font-semibold text-ink">
                  {paceDelta === 0
                    ? t.paceSame
                    : paceComparison.faster
                      ? t.paceFaster(paceDelta)
                      : t.paceSlower(paceDelta)}
                </b>
              ),
            })
          : t.paceEmpty}
        {overBudget !== null &&
          interpolate(budgetOutcome, {
            state: <b className="font-semibold text-ink">{overBudget ? t.overBudget : t.underBudget}</b>,
          })}
      </Insight>
      <Insight
        tone="bg-neg/10 text-neg"
        icon={<TriangleAlert className="size-3.5" />}
        label={t.risingLabel}
      >
        {topRiser
          ? interpolate(t.risingSentence, {
              category: <b className="font-semibold capitalize text-ink">{topRiser.category}</b>,
              delta: <b className="num font-semibold text-ink">+{Math.round(topRiser.delta)}%</b>,
            })
          : t.risingEmpty}
      </Insight>
      <Insight
        tone="bg-surface-hi text-ink-2"
        icon={<Wallet className="size-3.5" />}
        label={t.remainingLabel}
      >
        {/* Forecast only while the month runs; once closed the per-day deadline is
            meaningless, so show the month's leftover as a summary instead (COS-150). */}
        {inProgress
          ? interpolate(t.remainingSentence, {
              perDay: <b className="num font-semibold text-ink">{euro0(perDay)} €</b>,
              date: <b className="font-semibold text-ink">{lastDayLabel}</b>,
            })
          : remaining < 0
            ? interpolate(t.overspentSentence, {
                amount: (
                  <b className={cn("num font-semibold", balanceLevel === "danger" ? "text-neg" : "text-warn")}>
                    {euro0(-remaining)} €
                  </b>
                ),
              })
            : interpolate(t.unspentSentence, {
                amount: <b className="num font-semibold text-accent-strong">{euro0(remaining)} €</b>,
              })}
      </Insight>
      <Insight
        tone="bg-surface-hi text-ink-2"
        icon={<ArrowRightLeft className="size-3.5" />}
        label={t.busiestLabel}
      >
        {busiestRange
          ? interpolate(t.busiestSentence, {
              transactions: <b className="num font-semibold text-ink">{t.transactions(busiestRange.count)}</b>,
              range: (
                <Link
                  href={buildSpendingsPath(busiestRange.fromIso)}
                  className="cursor-pointer font-semibold text-ink underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
                >
                  {t.busiestRange(
                    format(busiestRange.from, "d", { locale: dateLocale }),
                    format(busiestRange.to, "d MMMM", { locale: dateLocale }),
                  )}
                </Link>
              ),
            })
          : t.busiestEmpty}
      </Insight>
    </DividedStrip>
  );
};

export default InsightsRibbon;
