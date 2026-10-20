import { MeterBar } from "@components/shared/MeterBar";
import overspendLevel, { overspendTextClass } from "@components/spendings/helpers/overspendLevel";
import CompareBar from "@components/statistics/dayOfWeek/CompareBar";
import { COMPARE_ANIM_MS, COMPARE_FILL, ROW_GRID } from "@components/statistics/dayOfWeek/constants";
import { deltaPct } from "@components/statistics/dayOfWeek/helpers/dayOfWeekScale";
import RowGuides from "@components/statistics/dayOfWeek/RowGuides";
import WeekdayBulletBar from "@components/statistics/dayOfWeek/WeekdayBulletBar";
import Whisker from "@components/statistics/dayOfWeek/Whisker";
import { scaleFrac } from "@components/statistics/helpers/weekdayBullet";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { AnimatedNumber } from "@lib/dataviz";

import type { DayOfWeekScale } from "@components/statistics/interfaces/dayOfWeekTypes";
import type { WeekdayStat } from "@components/statistics/interfaces/weekdayStatsTypes";

interface DayOfWeekRowProps {
  dow: number;
  stat: WeekdayStat;
  /** The compared year's stat for the weekday — cached even when the toggle is off, so the
   *  compare marks can animate out. */
  compareStat: WeekdayStat | null;
  compareYear: number;
  scale: DayOfWeekScale;
  /** The compared year has spending: its marks keep their space, faded in or out. */
  hasCompareData: boolean;
  showCompare: boolean;
  barsCollapsed: boolean;
  isPeak: boolean;
  isTrough: boolean;
}

/** One weekday: its name, the average bar with the typical-range whisker, and the amounts. */
const DayOfWeekRow = ({
  dow,
  stat: s,
  compareStat: cs,
  compareYear,
  scale,
  hasCompareData,
  showCompare,
  barsCollapsed,
  isPeak,
  isTrough,
}: DayOfWeekRowProps) => {
  const { euro, pct1 } = useFormat();
  const { dayOfWeek } = useTranslations("statistics");
  const { dayBudget, scaleMax, budgetFrac, dangerFrac, avgFrac } = scale;
  const level = overspendLevel(s.avgAmount, dayBudget);
  const compareDelta = cs ? deltaPct(s.avgAmount, cs.avgAmount) : null;
  const marker = isPeak ? (
    <span className="text-neg">▲</span>
  ) : isTrough ? (
    <span className="text-accent-strong">▼</span>
  ) : null;

  return (
    <div
      data-testid="weekday-row"
      data-dow={dow}
      className={`${ROW_GRID} text-sm`}
    >
      <span className="col-start-1 row-start-1 flex items-center gap-1.5 text-ink-2">
        <span className="inline-flex w-2 justify-center text-2xs leading-none">{marker}</span>
        {dayOfWeek.days[dow]}
      </span>
      <div className="relative col-start-1 col-end-3 row-start-2 flex flex-col justify-center md:col-start-2 md:row-start-1">
        <div className="relative">
          {dayBudget != null ? (
            <WeekdayBulletBar
              value={s.avgAmount}
              dayBudget={dayBudget}
              scaleMax={scaleMax}
              height={22}
            />
          ) : (
            <MeterBar
              value={scaleFrac(s.avgAmount, scaleMax) * 100}
              height={22}
              opacity={0.85}
            />
          )}
          {s.p90 > s.p10 && (
            <Whisker
              lowFrac={scaleFrac(s.p10, scaleMax)}
              highFrac={scaleFrac(s.p90, scaleMax)}
            />
          )}
        </div>
        {hasCompareData && cs && (
          <div
            className="pt-1"
            style={{ opacity: showCompare ? 1 : 0, transition: `opacity ${COMPARE_ANIM_MS}ms ease-out` }}
          >
            <CompareBar
              frac={scaleFrac(cs.avgAmount, scaleMax)}
              expanded={!barsCollapsed}
            />
          </div>
        )}
        <RowGuides
          budgetFrac={budgetFrac}
          dangerFrac={dangerFrac}
          avgFrac={avgFrac}
        />
      </div>
      <div className="num col-start-2 row-start-1 text-right md:col-start-3">
        <div className={`font-medium ${overspendTextClass(level)}`}>{euro(s.avgAmount)} €</div>
        <small className="block text-2xs font-normal text-ink-4">{dayOfWeek.transactionsPerDay(pct1(s.avgTx))}</small>
        {hasCompareData && cs && (
          <small
            className="mt-0.5 flex items-center justify-end gap-1 whitespace-nowrap text-2xs font-normal text-accent-d"
            style={{ opacity: showCompare ? 1 : 0, transition: `opacity ${COMPARE_ANIM_MS}ms ease-out` }}
          >
            <span
              className="inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: COMPARE_FILL }}
              aria-hidden
            />
            {compareYear}{" "}
            <AnimatedNumber
              value={showCompare ? cs.avgAmount : 0}
              decimals={2}
              suffix=" €"
            />
            {compareDelta != null && (
              <span className={compareDelta >= 0 ? "text-neg" : "text-accent-strong"}>
                {compareDelta >= 0 ? "↑" : "↓"}{" "}
                <AnimatedNumber
                  value={showCompare ? Math.abs(compareDelta) : 0}
                  decimals={0}
                  suffix=" %"
                />
              </span>
            )}
          </small>
        )}
      </div>
    </div>
  );
};

export default DayOfWeekRow;
