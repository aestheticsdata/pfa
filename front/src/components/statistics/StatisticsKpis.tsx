"use client";

import GlowCard from "@components/shared/GlowCard";
import { Overline } from "@components/shared/Overline";
import {
  biggestExceptional,
  exceptionalMonthly,
  exceptionalTotal,
} from "@components/statistics/helpers/exceptionalsData";
import {
  cumulative,
  elapsedMonths,
  MONTHS_FR,
  maxIndex,
  monthlyTotals,
  perCategoryTotals,
  yearTotal,
} from "@components/statistics/helpers/statisticsData";
import StatMiniChart from "@components/statistics/StatMiniChart";
import { euro0 } from "@lib/format";
import { cn } from "@lib/utils";
import { useState } from "react";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { StatisticsResponse } from "@src/schemas/stats";

interface StatisticsKpisProps {
  statistics: StatisticsResponse | undefined;
  year: number;
  compareYear: number;
  exceptionals: ExceptionalItem[];
  compareExceptionals: ExceptionalItem[];
  showExceptionals: boolean;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const Card = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <GlowCard className="flex flex-col px-5 py-6">
    <Overline>{label}</Overline>
    {children}
  </GlowCard>
);

const Value = ({ amount }: { amount: number }) => (
  <div className="num mb-1 mt-2.5 text-3xl font-medium leading-none tracking-tight text-ink">
    {euro0(amount)}
    <span className="text-xl font-normal text-ink-3"> €</span>
  </div>
);

const Delta = ({ down, children }: { down: boolean; children: React.ReactNode }) => (
  <span className={down ? "text-accent-strong" : "text-neg"}>
    {down ? "↓" : "↑"} {children}
  </span>
);

const CmpRow = ({
  tag,
  kind,
  title,
  titleVariant = "month",
  amount,
  regWidth,
  excWidth,
}: {
  tag: string;
  kind: "exc" | "reg";
  title: string;
  titleVariant?: "month" | "expense";
  amount: number;
  regWidth: number;
  excWidth: number;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          "num shrink-0 rounded-xs px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wider",
          kind === "exc" ? "bg-exc-bg text-exc" : "bg-accent-bg text-accent-strong",
        )}
      >
        {tag}
      </span>
      <span
        className={cn(
          "truncate",
          titleVariant === "month" ? "text-2xs uppercase tracking-caps text-ink-3" : "text-sm text-ink-2",
        )}
      >
        {title}
      </span>
      <span className="num ml-auto text-lg font-medium text-ink">{euro0(amount)} €</span>
    </div>
    <div className="flex h-2 overflow-hidden rounded-xs bg-surface-hi">
      <span
        style={{
          width: `${Math.max(0, regWidth) * 100}%`,
          background: "var(--accent-strong)",
          opacity: 0.9,
        }}
      />
      {excWidth > 0 && <span style={{ width: `${excWidth * 100}%`, background: "var(--exc)" }} />}
    </div>
  </div>
);

/** The four Statistiques KPI cards. Totals / averages / biggest month are real
 *  (from /statistics + /exceptionals); the "courante" biggest single expense in
 *  card 4 is MOCK — there is no per-transaction yearly endpoint. */
const StatisticsKpis = ({
  statistics,
  year,
  compareYear,
  exceptionals,
  compareExceptionals,
  showExceptionals,
}: StatisticsKpisProps) => {
  const [now] = useState(() => new Date());

  const data = statistics?.data;
  const regMonthly = monthlyTotals(data, year);
  const excMonthly = exceptionalMonthly(exceptionals);
  const totalMonthly = regMonthly.map((v, i) => v + (showExceptionals ? excMonthly[i] : 0));

  const months = elapsedMonths(year, now);
  const total = totalMonthly.reduce((a, b) => a + b, 0);
  const avg = total / months;

  const compareReg = yearTotal(data, compareYear);
  const compareExc = showExceptionals ? exceptionalTotal(compareExceptionals) : 0;
  const compareTotal = compareReg + compareExc;
  const compareAvg = compareTotal / elapsedMonths(compareYear, now);

  const deltaPct = compareTotal > 0 ? ((total - compareTotal) / compareTotal) * 100 : 0;
  const avgDelta = avg - compareAvg;

  // biggest month counting exceptionals vs regular-only
  const excYearTotal = exceptionalTotal(exceptionals);
  const totalIdx = maxIndex(totalMonthly);
  const regIdx = maxIndex(regMonthly);
  const cmpScale = Math.max(totalMonthly[totalIdx], 1);

  // biggest single expense
  const topExc = biggestExceptional(exceptionals);
  const topCategory = perCategoryTotals(data, statistics?.colors ?? {}, year)[0];
  // MOCK — no per-transaction yearly endpoint; approximated from the top category
  const mockRegularBiggest = topCategory
    ? { label: cap(topCategory.name), amount: Math.round(topCategory.value / months) }
    : { label: "Dépense courante", amount: 0 };
  const expenseScale = Math.max(Number(topExc?.amount ?? 0), mockRegularBiggest.amount, 1);

  return (
    <section className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 min-[768px]:grid-cols-4">
      <Card label={`Total dépensé ${year}`}>
        <Value amount={total} />
        <span className="text-xs text-ink-3">
          <Delta down={deltaPct <= 0}>{Math.abs(Math.round(deltaPct))}%</Delta> vs {compareYear} · sur {months} mois
        </span>
        <div className="mt-4">
          <StatMiniChart
            id="kpi-total"
            values={cumulative(totalMonthly)}
            count={months}
          />
        </div>
      </Card>

      <Card label="Moyenne / mois">
        <Value amount={avg} />
        <span className="text-xs text-ink-3">
          <Delta down={avgDelta <= 0}>{euro0(Math.abs(avgDelta))} €</Delta> vs moyenne {compareYear} (
          <span className="num font-medium text-ink">{euro0(compareAvg)} €</span>)
        </span>
        <div className="mt-4">
          <StatMiniChart
            id="kpi-avg"
            values={totalMonthly}
            count={months}
            average={avg}
          />
        </div>
      </Card>

      <Card label="Plus gros mois">
        <div className="mt-2 flex flex-1 flex-col justify-evenly gap-3">
          {showExceptionals && excYearTotal > 0 && (
            <CmpRow
              tag="avec exceptionnel"
              kind="exc"
              title={cap(MONTHS_FR[totalIdx])}
              amount={totalMonthly[totalIdx]}
              regWidth={regMonthly[totalIdx] / cmpScale}
              excWidth={excMonthly[totalIdx] / cmpScale}
            />
          )}
          <CmpRow
            tag="hors exceptionnel"
            kind="reg"
            title={cap(MONTHS_FR[regIdx])}
            amount={regMonthly[regIdx]}
            regWidth={regMonthly[regIdx] / cmpScale}
            excWidth={0}
          />
        </div>
      </Card>

      <Card label="Plus grosse dépense">
        <div className="mt-2 flex flex-1 flex-col justify-evenly gap-3">
          {showExceptionals && topExc && (
            <CmpRow
              tag="exceptionnelle"
              kind="exc"
              title={cap(topExc.label)}
              titleVariant="expense"
              amount={Number(topExc.amount)}
              regWidth={0}
              excWidth={Number(topExc.amount) / expenseScale}
            />
          )}
          <CmpRow
            tag="courante"
            kind="reg"
            title={mockRegularBiggest.label}
            titleVariant="expense"
            amount={mockRegularBiggest.amount}
            regWidth={mockRegularBiggest.amount / expenseScale}
            excWidth={0}
          />
        </div>
      </Card>
    </section>
  );
};

export default StatisticsKpis;
