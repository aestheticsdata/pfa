import { SEARCH_TIMELINE_BUCKET } from "@components/statistics/helpers/searchTimelineData";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { format, parseISO } from "date-fns";

import type { SearchTimelineBucketSize, TimelinePoint } from "@components/statistics/interfaces/searchTimelineTypes";

interface SearchTimelineTooltipContentProps {
  point: TimelinePoint;
  bucket: SearchTimelineBucketSize;
  /** Occurrences in the rolling window ending at the hovered bucket. */
  rolling: number;
  windowDays: number;
}

/** The hovered bucket: its day or week, what was spent there, and the rolling count. */
const SearchTimelineTooltipContent = ({ point, bucket, rolling, windowDays }: SearchTimelineTooltipContentProps) => {
  const { euro } = useFormat();
  const dateLocale = useDateLocale();
  const { searchTimeline: t } = useTranslations("statistics");

  return (
    <>
      <div className="font-medium capitalize">
        {bucket === SEARCH_TIMELINE_BUCKET.day
          ? format(parseISO(point.date), "EEE d MMM yyyy", { locale: dateLocale })
          : t.tooltip.weekOf(format(parseISO(point.date), "d MMM yyyy", { locale: dateLocale }))}
      </div>
      <div className="mt-0.5">
        {point.count > 0 ? `${euro(point.total)} € · ${t.tooltip.spendings(point.count)}` : t.tooltip.noSpend}
      </div>
      <div className="text-ink-3">{t.tooltip.rolling(rolling, windowDays)}</div>
    </>
  );
};

export default SearchTimelineTooltipContent;
