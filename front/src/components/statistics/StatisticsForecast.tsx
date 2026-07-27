"use client";

import GlowCard from "@components/shared/GlowCard";
import { Overline } from "@components/shared/Overline";
import { exceptionalTotal } from "@components/statistics/helpers/exceptionalsData";
import { projectedRemainingRegular, toYearMonthly } from "@components/statistics/helpers/projection";
import { yearTotal } from "@components/statistics/helpers/statisticsData";
import { Tooltip } from "@components/ui/tooltip";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { AnimatedNumber, ProgressTrack, useCursorHover } from "@lib/dataviz";
import format from "date-fns/format";
import getDayOfYear from "date-fns/getDayOfYear";
import { useState } from "react";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { StatisticsResponse } from "@src/schemas/stats";

interface StatisticsForecastProps {
  statistics: StatisticsResponse | undefined;
  year: number;
  compareYear: number;
  exceptionals: ExceptionalItem[];
  compareExceptionals: ExceptionalItem[];
  showExceptionals: boolean;
}

const StatisticsForecast = ({
  statistics,
  year,
  compareYear,
  exceptionals,
  compareExceptionals,
  showExceptionals,
}: StatisticsForecastProps) => {
  const { euro, euro0 } = useFormat();
  const statisticsText = useTranslations("statistics");
  const dateLocale = useDateLocale();
  const [now] = useState(() => new Date());
  const projectionTip = useCursorHover();
  const { forecast: t } = statisticsText;
  const data = statistics?.data;

  const spent = yearTotal(data, year) + (showExceptionals ? exceptionalTotal(exceptionals) : 0);
  const compareTotal = yearTotal(data, compareYear) + (showExceptionals ? exceptionalTotal(compareExceptionals) : 0);

  const isCurrent = year === now.getFullYear();
  const daysInYear = getDayOfYear(new Date(year, 11, 31));
  const daysElapsed = isCurrent ? getDayOfYear(now) : daysInYear;
  const perDay = daysElapsed > 0 ? spent / daysElapsed : 0;
  const asOfLabel = isCurrent ? format(now, "d MMM", { locale: dateLocale }) : t.endOfYear;

  // Real end-of-year projection: cumulative-to-date + the rest of the year
  // estimated month by month from history (same month N-1 → N-2 → previous
  // month), exceptionals left as known one-offs. A past year is already complete,
  // so its projection is just its actual total. `null` remaining = the user's very
  // first month of data (no reference) → no projection shown.
  const remaining = isCurrent
    ? projectedRemainingRegular(
        toYearMonthly(data, year),
        toYearMonthly(data, year - 1),
        toYearMonthly(data, year - 2),
        now,
      )
    : 0;
  const projection = remaining === null ? null : spent + remaining;
  const delta = projection === null ? 0 : projection - compareTotal;
  // Tell "loaded, no history" (show the reason) apart from "still loading" (stay
  // silent) — the empty-reference path resolves to null in both cases.
  const noHistory = projection === null && data !== undefined;

  return (
    <GlowCard
      as="section"
      className="grid grid-cols-1 items-center gap-6 px-6 py-5 sm:grid-cols-[220px_1fr_240px] sm:gap-8"
    >
      <div className="flex flex-col gap-1">
        <Overline>{t.spentLabel(asOfLabel)}</Overline>
        <AnimatedNumber
          value={spent}
          decimals={0}
          suffix=" €"
          className="num text-2xl font-medium tracking-tight text-ink"
        />
        <span className="text-xs text-ink-3">{t.perDay(daysElapsed, euro(perDay))}</span>
      </div>

      <div className="pt-6">
        <ProgressTrack
          key={`${year}-${spent > 0 ? "d" : "e"}`}
          value={daysElapsed}
          max={daysInYear}
          projected={daysInYear}
          marker={daysElapsed}
          markerLabel={asOfLabel}
          gradient
          animate
          height={36}
          radius={8}
        />
        <div className="mt-2 flex items-center justify-between text-2xs text-ink-4">
          <span className="num">{t.startOfYear}</span>
          <span>{t.projectionAxis}</span>
          <span className="num">{t.endOfYear}</span>
        </div>
      </div>

      <div
        className="flex flex-col items-start gap-1 sm:items-end sm:text-right"
        role="img"
        aria-label={t.projectionTitle}
        onMouseMove={projectionTip.move()}
        onMouseLeave={projectionTip.clear}
      >
        <Overline>{t.projectionTitle}</Overline>
        {projection === null ? (
          <>
            <span className="num text-2xl font-medium tracking-tight text-ink-3">—</span>
            {noHistory && <span className="text-xs text-ink-3">{t.noProjection}</span>}
          </>
        ) : (
          <>
            <AnimatedNumber
              value={projection}
              decimals={0}
              suffix=" €"
              color="var(--accent-strong)"
              className="num text-2xl font-medium tracking-tight"
            />
            <span className="text-xs text-ink-3">
              <span className={delta > 0 ? "text-neg" : "text-accent-strong"}>
                {delta > 0 ? `+${euro0(delta)}` : euro0(delta)} €
              </span>{" "}
              {t.vsCompare(compareYear, euro0(compareTotal))}
            </span>
          </>
        )}
        <Tooltip
          mode="cursor"
          point={projectionTip.hover}
        >
          {projectionTip.hover
            ? projection === null
              ? noHistory
                ? t.tooltip.noProjection
                : null
              : isCurrent
                ? t.tooltip.projectionModel
                : t.tooltip.projectionActual
            : null}
        </Tooltip>
      </div>
    </GlowCard>
  );
};

export default StatisticsForecast;
