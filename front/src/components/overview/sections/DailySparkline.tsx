"use client";

// MOCK — the dashed projection tail (today → month-end at the running average)
// is synthetic; the daily history up to today is real.

import { useMemo } from "react";
import getDaysInMonth from "date-fns/getDaysInMonth";
import getDate from "date-fns/getDate";
import parseISO from "date-fns/parseISO";
import isSameMonth from "date-fns/isSameMonth";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useSpendings from "@components/spendings/services/useSpendings";
import { LineChart } from "@components/dataviz";
import { euro } from "@components/overview/format";

import type { LinePoint } from "@components/dataviz";

const DailySparkline = () => {
  const { from } = useDatePickerWrapperStore();
  const { spendingsByMonth } = useSpendings();

  const monthRef = from ?? new Date();
  const daysInMonth = getDaysInMonth(monthRef);

  const { real, projection, todayX, todayY, avg, peak } = useMemo(() => {
    const isThisMonth = isSameMonth(monthRef, new Date());
    const today = isThisMonth ? getDate(new Date()) : daysInMonth;
    const totals = new Array(daysInMonth + 1).fill(0) as number[];
    for (const s of spendingsByMonth ?? []) {
      const d = getDate(parseISO(s.date));
      if (d >= 1 && d <= daysInMonth) totals[d] += Number(s.amount);
    }
    const realPts: LinePoint[] = [];
    for (let d = 1; d <= today; d += 1) realPts.push({ x: d, y: totals[d] });
    const active = realPts.filter((p) => p.y > 0);
    const average = active.length
      ? active.reduce((a, p) => a + p.y, 0) / active.length
      : 0;
    const peakVal = realPts.reduce((m, p) => Math.max(m, p.y), 0);
    const projPts: LinePoint[] =
      today < daysInMonth
        ? [
            { x: today, y: totals[today] || average },
            { x: daysInMonth, y: average },
          ]
        : [];
    return {
      real: realPts,
      projection: projPts,
      todayX: today,
      todayY: totals[today] ?? 0,
      avg: average,
      peak: peakVal,
    };
  }, [spendingsByMonth, monthRef, daysInMonth]);

  return (
    <section className="pfa-card flex flex-col gap-3 px-6 py-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Consommation jour par jour
        </h2>
        <span className="text-xs text-ink-4">
          moy. <span className="num text-ink-2">{euro(avg)} €</span> · pic{" "}
          <span className="num text-ink-2">{euro(peak)} €</span>
        </span>
      </div>
      <div className="pt-2">
        <LineChart
          id="dash-spark"
          height={120}
          xDomain={[1, daysInMonth]}
          series={[
            { points: real, color: "var(--accent-strong)", area: true },
            { points: projection, color: "var(--accent-d)", dashed: true },
          ]}
          markers={todayX < daysInMonth ? [{ x: todayX, color: "var(--elec)" }] : []}
          dots={todayY > 0 ? [{ x: todayX, y: todayY, color: "var(--accent-strong)" }] : []}
          gridLines={3}
          ariaLabel="Consommation quotidienne"
        />
      </div>
    </section>
  );
};

export default DailySparkline;
