"use client";

// MOCK — the end-of-year projection is a synthetic average-forward model
// (spent / days-elapsed × days-in-year). Spent + the year-over-year figure are real.

import GlowCard from "@components/shared/GlowCard";
import { Overline } from "@components/shared/Overline";
import { exceptionalTotal } from "@components/statistics/helpers/exceptionalsData";
import { yearTotal } from "@components/statistics/helpers/statisticsData";
import { AnimatedNumber, CursorTooltip, ProgressTrack, useCursorHover } from "@lib/dataviz";
import { euro, euro0 } from "@lib/format";
import statisticsText from "@text/statistics";
import format from "date-fns/format";
import getDayOfYear from "date-fns/getDayOfYear";
import fr from "date-fns/locale/fr";
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
  const [now] = useState(() => new Date());
  const projectionTip = useCursorHover();
  const { forecast: t } = statisticsText;
  const data = statistics?.data;

  const spent = yearTotal(data, year) + (showExceptionals ? exceptionalTotal(exceptionals) : 0);
  const compareTotal = yearTotal(data, compareYear) + (showExceptionals ? exceptionalTotal(compareExceptionals) : 0);

  const isCurrent = year === now.getFullYear();
  const daysInYear = getDayOfYear(new Date(year, 11, 31));
  const daysElapsed = isCurrent ? getDayOfYear(now) : daysInYear;
  const projection = isCurrent && daysElapsed > 0 ? (spent / daysElapsed) * daysInYear : spent; // MOCK
  const perDay = daysElapsed > 0 ? spent / daysElapsed : 0;
  const delta = projection - compareTotal;
  const asOfLabel = isCurrent ? format(now, "d MMM", { locale: fr }) : t.endOfYear;

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
        <CursorTooltip point={projectionTip.hover}>
          {projectionTip.hover
            ? isCurrent
              ? t.tooltip.projectionModel(euro(perDay), daysInYear)
              : t.tooltip.projectionActual
            : null}
        </CursorTooltip>
      </div>
    </GlowCard>
  );
};

export default StatisticsForecast;
