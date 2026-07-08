"use client";

// MOCK — the end-of-year projection is a synthetic average-forward model
// (spent / days-elapsed × days-in-year). Spent + the year-over-year figure are real.

import { useState } from "react";
import getDayOfYear from "date-fns/getDayOfYear";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { AnimatedNumber, ProgressTrack } from "@lib/dataviz";
import GlowCard from "@components/shared/GlowCard";
import { yearTotal } from "@components/statistics/helpers/statisticsData";
import { exceptionalTotal } from "@components/statistics/helpers/exceptionalsData";
import { euro, euro0 } from "@components/dashboard/format";

import type { StatisticsResponse } from "@src/schemas/stats";
import type { ExceptionalItem } from "@src/schemas/exceptionals";

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
  const data = statistics?.data;

  const spent =
    yearTotal(data, year) +
    (showExceptionals ? exceptionalTotal(exceptionals) : 0);
  const compareTotal =
    yearTotal(data, compareYear) +
    (showExceptionals ? exceptionalTotal(compareExceptionals) : 0);

  const isCurrent = year === now.getFullYear();
  const daysInYear = getDayOfYear(new Date(year, 11, 31));
  const daysElapsed = isCurrent ? getDayOfYear(now) : daysInYear;
  const projection =
    isCurrent && daysElapsed > 0 ? (spent / daysElapsed) * daysInYear : spent; // MOCK
  const perDay = daysElapsed > 0 ? spent / daysElapsed : 0;
  const delta = projection - compareTotal;
  const asOfLabel = isCurrent ? format(now, "d MMM", { locale: fr }) : "31 déc.";

  return (
    <GlowCard
      as="section"
      className="grid grid-cols-1 items-center gap-6 px-6 py-5 sm:grid-cols-[220px_1fr_240px] sm:gap-8"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
          Dépensé · 1er janv. → {asOfLabel}
        </span>
        <AnimatedNumber
          value={spent}
          decimals={0}
          suffix=" €"
          className="num text-[24px] font-medium tracking-[-0.02em] text-ink"
        />
        <span className="text-[12px] text-ink-3">
          {daysElapsed} jours · {euro(perDay)} €/jour
        </span>
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
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink-4">
          <span className="num">1er janv.</span>
          <span>— projection —</span>
          <span className="num">31 déc.</span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1 sm:items-end sm:text-right">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
          Projection fin d&apos;année
        </span>
        <AnimatedNumber
          value={projection}
          decimals={0}
          suffix=" €"
          color="var(--accent-strong)"
          className="num text-[24px] font-medium tracking-[-0.02em]"
        />
        <span className="text-[12px] text-ink-3">
          <span className={delta > 0 ? "text-neg" : "text-accent-strong"}>
            {delta > 0 ? `+${euro0(delta)}` : euro0(delta)} €
          </span>{" "}
          vs {compareYear} ({euro0(compareTotal)} €)
        </span>
      </div>
    </GlowCard>
  );
};

export default StatisticsForecast;
