"use client";

// MOCK — the dashed projection tail (today → month-end at the running average)
// is synthetic; the daily history up to today and the average/peak are real.
// Rendered as a card-less section: it nests inside the BudgetHero card, matching
// the `.spark-section` block of Dashboard 2026.html.

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useSpendings from "@components/spendings/services/useSpendings";
import { LineChart } from "@lib/dataviz";
import { euro } from "@lib/format";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isSameMonth from "date-fns/isSameMonth";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";
import { useMemo } from "react";

import type { LinePoint } from "@lib/dataviz";

const DailySparkline = () => {
  const { from } = useDatePickerWrapperStore();
  const { spendingsByMonth } = useSpendings();

  const monthRef = from ?? new Date();
  const daysInMonth = getDaysInMonth(monthRef);

  const { real, projection, todayX, todayY, avg, peak, peakDay } = useMemo(() => {
    const isThisMonth = isSameMonth(monthRef, new Date());
    const today = isThisMonth ? getDate(new Date()) : daysInMonth;
    const totals = new Array(daysInMonth + 1).fill(0) as number[];
    for (const s of spendingsByMonth ?? []) {
      const d = getDate(parseISO(s.date));
      if (!Number.isNaN(d) && d >= 1 && d <= daysInMonth) {
        totals[d] += Number(s.amount);
      }
    }
    const realPts: LinePoint[] = [];
    for (let d = 1; d <= today; d += 1) realPts.push({ x: d, y: totals[d] });
    const active = realPts.filter((p) => p.y > 0);
    const average = active.length ? active.reduce((a, p) => a + p.y, 0) / active.length : 0;
    let peakVal = 0;
    let peakD = 0;
    for (const p of realPts) {
      if (p.y > peakVal) {
        peakVal = p.y;
        peakD = p.x;
      }
    }
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
      peakDay: peakD,
    };
  }, [spendingsByMonth, monthRef, daysInMonth]);

  const ticks = Array.from({ length: 6 }, (_, i) => Math.round(1 + ((daysInMonth - 1) * i) / 5));
  // The today marker / crossing-dot / date-label only make sense while the
  // viewed month is in progress (a "today" falls inside it).
  const showToday = todayX < daysInMonth;
  // Positions as % of the chart box. LineChart maps its [1, daysInMonth] x-domain
  // and [0, peak] y-domain into a 600×110 viewBox with 6px padding all round.
  const dotLeftPct = 1 + ((todayX - 1) / (daysInMonth - 1)) * 98;
  const dotTopPct = peak > 0 ? ((104 - (todayY / peak) * 98) / 110) * 100 : 50;
  const avgTopPct = peak > 0 ? ((104 - (avg / peak) * 98) / 110) * 100 : 50;
  const todayLabel = format(new Date(), "d MMM", { locale: fr });
  const peakLabel =
    peakDay > 0
      ? format(new Date(2000, monthRef.getMonth(), peakDay), "dd MMM", {
          locale: fr,
        })
      : "—";
  // remount key → replays the left→right draw on month change / data load
  const curveKey = `${format(monthRef, "yyyy-MM")}-${peak > 0 ? "d" : "e"}`;

  return (
    <div className="mt-6 border-t border-line-soft pt-4.5">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3 className="text-xs font-medium tracking-normal text-ink-2">Consommation jour par jour</h3>
        <div className="flex gap-5 text-xs text-ink-3">
          <span>
            Moyenne <span className="num text-ink">{euro(avg)} €</span>/jour
          </span>
          <span>
            Pic <span className="num text-ink">{euro(peak)} €</span> · {peakLabel}
          </span>
        </div>
      </div>

      <div
        key={curveKey}
        className="pfa-anim-draw-x relative"
      >
        <LineChart
          id="dash-spark"
          height={110}
          xDomain={[1, daysInMonth]}
          series={[
            { points: real, color: "var(--accent-strong)", area: true },
            { points: projection, color: "var(--accent-d)", dashed: true },
            // average reference line
            {
              points: [
                { x: 1, y: avg },
                { x: daysInMonth, y: avg },
              ],
              color: "var(--ink-4)",
              dashed: true,
              width: 1,
            },
          ]}
          markers={showToday ? [{ x: todayX, color: "var(--ink-3)" }] : []}
          gridLines={3}
          ariaLabel="Consommation quotidienne"
        />
        <span
          className="num pointer-events-none absolute right-2 text-3xs text-ink-4"
          style={{ top: `calc(${avgTopPct}% - 18px)` }}
        >
          moy. {euro(avg)} €
        </span>
        {showToday && (
          <>
            <span
              className="num pointer-events-none absolute top-0.5 pl-1.5 text-3xs tracking-wide text-ink-2"
              style={{ left: `${dotLeftPct}%` }}
            >
              {todayLabel}
            </span>
            {/* HTML overlay dot → stays perfectly round regardless of the
                non-uniform SVG scaling (unlike an in-SVG <circle>). */}
            <span
              className="pointer-events-none absolute box-border size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent-strong bg-surface-elev"
              style={{ left: `${dotLeftPct}%`, top: `${dotTopPct}%` }}
            />
          </>
        )}
      </div>

      <div className="num mt-1 flex justify-between text-3xs text-ink-4">
        {ticks.map((d) => (
          <span key={d}>{String(d).padStart(2, "0")}</span>
        ))}
      </div>
    </div>
  );
};

export default DailySparkline;
