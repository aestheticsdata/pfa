"use client";

// Spent-so-far against the month's budget, with the end-of-month projection.
// The projection is the realized total plus what the historical reference
// period says is still to come over the days left (PFA-175) — the same
// reference the sparkline draws its dashed tail from, so the figure and the
// curve agree. It is absent, never zero, when there is nothing to project from.

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { Overline } from "@components/shared/Overline";
import useDashboard from "@components/spendings/services/useDashboard";
import useEndOfMonthProjection from "@components/spendings/services/useEndOfMonthProjection";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { AnimatedNumber, ProgressTrack } from "@lib/dataviz";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import isBefore from "date-fns/isBefore";
import isSameMonth from "date-fns/isSameMonth";
import startOfMonth from "date-fns/startOfMonth";

const ForecastStrip = () => {
  const { euro0 } = useFormat();
  const dashboardText = useTranslations("dashboard");
  const dateLocale = useDateLocale();
  const { from } = useDatePickerWrapperStore();
  const {
    get: { data: dashboard },
    monthlyTotal,
  } = useDashboard();
  const { projection, noHistory } = useEndOfMonthProjection();
  const { forecastStrip: t } = dashboardText;
  const budget = Number(dashboard?.initialAmount ?? 0);
  const now = new Date();
  const monthRef = from ?? now;
  const isThisMonth = isSameMonth(monthRef, now);
  const isPastMonth = isBefore(startOfMonth(monthRef), startOfMonth(now));
  // "as of" date shown next to "Spent": today for the current month, the last
  // day of a past (complete) one, the first day of a month still to come.
  const asOf = isThisMonth ? now : isPastMonth ? endOfMonth(monthRef) : startOfMonth(monthRef);
  const spentPct = budget > 0 ? Math.round((monthlyTotal / budget) * 100) : 0;
  const delta = projection === null ? 0 : projection - budget;
  // The striped band only exists where the projection reaches past what is
  // already spent — the same test ProgressTrack applies, so the legend can
  // never name a band that is not drawn.
  const showProjectionBand = projection !== null && projection > monthlyTotal;

  return (
    <GlowCard
      as="section"
      className="grid grid-cols-1 items-center gap-6 px-6 py-5 sm:grid-cols-[200px_1fr_200px] sm:gap-8"
    >
      <div className="flex flex-col gap-1">
        <Overline>{t.spent(format(asOf, "d MMM", { locale: dateLocale }))}</Overline>
        <AnimatedNumber
          value={monthlyTotal}
          decimals={0}
          suffix=" €"
          className="num text-xl font-medium tracking-normal text-ink"
        />
        <span className="text-xs text-ink-3">{t.pctOfBudget(spentPct)}</span>
      </div>

      <div className="pt-6">
        <ProgressTrack
          key={`${format(monthRef, "yyyy-MM")}-${monthlyTotal > 0 || showProjectionBand ? "d" : "e"}`}
          value={monthlyTotal}
          max={budget > 0 ? budget : Math.max(projection ?? 0, monthlyTotal, 1)}
          projected={projection ?? undefined}
          marker={monthlyTotal}
          markerLabel={t.todayMarker}
          gradient
          animate
          height={36}
          radius={8}
        />
        <div className="mt-2 flex items-center justify-between text-2xs text-ink-4">
          <span className="num">0 €</span>
          <span className="flex items-center gap-4 text-ink-3">
            <LegendItem
              swatch={
                <span
                  className="inline-block h-2 w-3 rounded-xs"
                  style={{
                    background: "var(--bar-fill)",
                    opacity: 0.55,
                  }}
                />
              }
            >
              {t.realized}
            </LegendItem>
            {showProjectionBand && (
              <LegendItem
                swatch={
                  <span
                    className="inline-block h-2 w-3 rounded-xs border border-accent-d"
                    style={{
                      background: "repeating-linear-gradient(45deg,transparent 0 3px,var(--accent-d) 3px 6px)",
                    }}
                  />
                }
              >
                {t.projection}
              </LegendItem>
            )}
          </span>
          <span className="num">
            {euro0(budget)}
            {t.budgetLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1 sm:items-end sm:text-right">
        <Overline>{t.endOfMonthProjection}</Overline>
        {projection === null ? (
          <>
            <span className="num text-xl font-medium tracking-normal text-ink-3">—</span>
            {noHistory && <span className="text-xs text-ink-3">{t.noProjection}</span>}
          </>
        ) : (
          <>
            <AnimatedNumber
              value={projection}
              decimals={0}
              suffix=" €"
              color={delta > 0 ? "var(--neg)" : "var(--accent-strong)"}
              className="num text-xl font-medium tracking-normal"
            />
            {budget > 0 && (
              <span className="text-xs text-ink-3">
                <span className={delta > 0 ? "text-neg" : "text-accent-strong"}>
                  {delta > 0 ? `+${euro0(delta)} €` : `${euro0(delta)} €`}
                </span>{" "}
                {delta > 0 ? t.above : t.underBudget}
              </span>
            )}
          </>
        )}
      </div>
    </GlowCard>
  );
};

export default ForecastStrip;
