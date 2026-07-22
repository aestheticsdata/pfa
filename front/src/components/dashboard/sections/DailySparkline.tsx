"use client";

// Rendered as a card-less section: it nests inside the BudgetHero card, matching
// the `.spark-section` block of Dashboard 2026.html. The daily history up to
// today and the average/peak are real; the dashed tail after today is the
// historical reference period (useDailyProjection), drawn smoothed. The
// reference follows the GLOBAL projection chain and is absent at the user's very
// first month of data (source "none" → no tail, no legend).

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDailyProjection from "@components/spendings/services/useDailyProjection";
import useSpendings from "@components/spendings/services/useSpendings";
import { interpolate } from "@i18n/interpolate";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { LineChart } from "@lib/dataviz";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isSameMonth from "date-fns/isSameMonth";
import parseISO from "date-fns/parseISO";
import { useMemo } from "react";

import type { LinePoint } from "@lib/dataviz";
import type { ProjectionSource } from "@src/schemas/dashboard";

const DailySparkline = () => {
  const { euro } = useFormat();
  const dashboardText = useTranslations("dashboard");
  const dateLocale = useDateLocale();
  const { from } = useDatePickerWrapperStore();
  const { spendingsByMonth } = useSpendings();
  const { data: projectionData } = useDailyProjection();
  const { dailySparkline: t } = dashboardText;

  const monthRef = from ?? new Date();
  const daysInMonth = getDaysInMonth(monthRef);

  const { real, projection, projectionSource, todayX, todayY, avg, peak, peakDay } = useMemo(() => {
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
    // Projected tail: the reference month's day-by-day totals for the days after
    // today. Only for the in-progress month with a usable reference (source
    // "none" → the user's first month of data → no tail). It starts at today's
    // real point so the dashed curve continues seamlessly from the solid one.
    // A reference month shorter than the current one carries its last day's value
    // forward for the overhanging days.
    const source: ProjectionSource = projectionData?.source ?? "none";
    const refDaily = projectionData?.dailyTotals ?? [];
    const canProject = isThisMonth && today < daysInMonth && source !== "none" && refDaily.length > 0;
    const projPts: LinePoint[] = canProject
      ? [
          { x: today, y: totals[today] ?? 0 },
          ...Array.from({ length: daysInMonth - today }, (_, i) => {
            const day = today + 1 + i;
            const refValue = refDaily[day - 1] ?? refDaily[refDaily.length - 1] ?? 0;
            return { x: day, y: refValue };
          }),
        ]
      : [];
    return {
      real: realPts,
      projection: projPts,
      projectionSource: canProject ? source : ("none" as ProjectionSource),
      todayX: today,
      todayY: totals[today] ?? 0,
      avg: average,
      peak: peakVal,
      peakDay: peakD,
    };
  }, [spendingsByMonth, monthRef, daysInMonth, projectionData]);

  const ticks = Array.from({ length: 6 }, (_, i) => Math.round(1 + ((daysInMonth - 1) * i) / 5));
  // The today marker / crossing-dot / date-label only make sense while the
  // viewed month is in progress (a "today" falls inside it).
  const showToday = todayX < daysInMonth;
  // The projected tail can exceed the real peak, so the chart's y-domain — and
  // the overlay math below — must key off the greater of the two, else the dot /
  // avg label drift out of alignment with the rendered curve.
  const projMax = projection.reduce((m, p) => Math.max(m, p.y), 0);
  const yTop = Math.max(peak, projMax);
  // Positions as % of the chart box. LineChart maps its [1, daysInMonth] x-domain
  // and [0, yTop] y-domain into a 600×110 viewBox with 6px padding all round.
  const dotLeftPct = 1 + ((todayX - 1) / (daysInMonth - 1)) * 98;
  const dotTopPct = yTop > 0 ? ((104 - (todayY / yTop) * 98) / 110) * 100 : 50;
  const avgTopPct = yTop > 0 ? ((104 - (avg / yTop) * 98) / 110) * 100 : 50;
  const todayLabel = format(new Date(), "d MMM", { locale: dateLocale });
  const peakLabel =
    peakDay > 0
      ? format(new Date(2000, monthRef.getMonth(), peakDay), "dd MMM", {
          locale: dateLocale,
        })
      : "—";
  // remount key → replays the left→right draw on month change / data load
  const curveKey = `${format(monthRef, "yyyy-MM")}-${peak > 0 ? "d" : "e"}`;

  return (
    <div className="mt-6 border-t border-line-soft pt-4.5">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3 className="text-xs font-medium tracking-normal text-ink-2">{t.title}</h3>
        <div className="flex gap-5 text-xs text-ink-3">
          <span>
            {interpolate(t.averageLine, {
              avg: <span className="num text-ink">{euro(avg)} €</span>,
            })}
          </span>
          <span>
            {t.peak} <span className="num text-ink">{euro(peak)} €</span> · {peakLabel}
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
          yDomain={[0, yTop]}
          series={[
            { points: real, color: "var(--accent-strong)", area: true },
            { points: projection, color: "var(--accent-d)", dashed: true, smooth: true },
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
          ariaLabel={t.chartAria}
        />
        <span
          className="num pointer-events-none absolute right-2 text-3xs text-ink-4"
          style={{ top: `calc(${avgTopPct}% - 18px)` }}
        >
          {t.avgShort} {euro(avg)} €
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

      {projectionSource !== "none" && (
        <p className="mt-1.5 text-right text-3xs text-ink-4">{t.projectionBasis[projectionSource]}</p>
      )}
    </div>
  );
};

export default DailySparkline;
