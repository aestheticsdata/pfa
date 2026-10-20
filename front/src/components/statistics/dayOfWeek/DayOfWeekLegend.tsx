import { BAND_FILL, COMPARE_ANIM_MS, COMPARE_FILL } from "@components/statistics/dayOfWeek/constants";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";

import type { ReactNode } from "react";

interface LegendItemProps {
  swatch: ReactNode;
  children: ReactNode;
}

/** A swatch + label pair in the bottom legend. */
const LegendItem = ({ swatch, children }: LegendItemProps) => (
  <span className="inline-flex items-center gap-1.5">
    {swatch}
    {children}
  </span>
);

interface BandSwatchProps {
  fill: string;
}

const BandSwatch = ({ fill }: BandSwatchProps) => (
  <span
    className="h-2 w-4 rounded-xs"
    style={{ background: fill }}
  />
);

interface DayOfWeekLegendProps {
  dayBudget: number | null;
  dangerBudget: number | null;
  compareYear: number;
  hasCompareData: boolean;
  showCompare: boolean;
}

/** The colour zones (with a ceiling), the typical range, the average and the compared year. */
const DayOfWeekLegend = ({
  dayBudget,
  dangerBudget,
  compareYear,
  hasCompareData,
  showCompare,
}: DayOfWeekLegendProps) => {
  const { euro0 } = useFormat();
  const { dayOfWeek } = useTranslations("statistics");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-2xs text-ink-4">
      {dayBudget != null && dangerBudget != null && (
        <>
          <LegendItem swatch={<BandSwatch fill={BAND_FILL.under} />}>
            {dayOfWeek.legend.under(euro0(dayBudget))}
          </LegendItem>
          <LegendItem swatch={<BandSwatch fill={BAND_FILL.between} />}>
            {dayOfWeek.legend.between(euro0(dayBudget), euro0(dangerBudget))}
          </LegendItem>
          <LegendItem swatch={<BandSwatch fill={BAND_FILL.over} />}>
            {dayOfWeek.legend.over(euro0(dangerBudget))}
          </LegendItem>
        </>
      )}
      <LegendItem
        swatch={
          <span className="relative inline-block h-2.5 w-4">
            <span className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-ink-2/60" />
            <span className="absolute inset-y-0 left-0 w-px bg-ink-2" />
            <span className="absolute inset-y-0 right-0 w-px bg-ink-2" />
          </span>
        }
      >
        {dayOfWeek.legend.typicalRange}
      </LegendItem>
      <LegendItem swatch={<span className="inline-block h-0 w-4 border-t-2 border-dashed border-accent-strong/80" />}>
        {dayOfWeek.legend.average}
      </LegendItem>
      {hasCompareData && (
        <span
          className="inline-flex"
          style={{ opacity: showCompare ? 1 : 0, transition: `opacity ${COMPARE_ANIM_MS}ms ease-out` }}
        >
          <LegendItem swatch={<BandSwatch fill={COMPARE_FILL} />}>
            {dayOfWeek.legend.comparedYear(compareYear)}
          </LegendItem>
        </span>
      )}
    </div>
  );
};

export default DayOfWeekLegend;
