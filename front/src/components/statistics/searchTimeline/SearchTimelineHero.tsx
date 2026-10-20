import { SEARCH_TIMELINE_RANGE_VALUES } from "@components/statistics/helpers/searchTimelineData";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";

import type { SearchTimelineRange } from "@components/statistics/interfaces/searchTimelineTypes";
import type { SearchTimelineResponse } from "@src/schemas/stats";

interface SearchTimelineHeroProps {
  summary: SearchTimelineResponse["summary"] | undefined;
  range: SearchTimelineRange;
  hasQuery: boolean;
  onRangeChange: (range: SearchTimelineRange) => void;
}

/** The total and the occurrence count for the range, beside the range switcher (disabled until a search). */
const SearchTimelineHero = ({ summary, range, hasQuery, onRangeChange }: SearchTimelineHeroProps) => {
  const { euro0 } = useFormat();
  const { searchTimeline: t } = useTranslations("statistics");

  return (
    <div className="mt-4.5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-baseline gap-6">
        <div>
          <div className="num text-3xl font-medium leading-none tracking-tight text-ink">
            {summary ? `${euro0(summary.total)} €` : "—"}
          </div>
          <div className="mt-2 text-2xs uppercase tracking-caps text-ink-3">{t.totalSpent}</div>
        </div>
        <div>
          <div className="num text-2xl font-medium leading-none tracking-tight text-accent-strong">
            {summary ? summary.count : "—"}
          </div>
          <div className="mt-2 text-2xs uppercase tracking-caps text-ink-3">{t.occurrences}</div>
        </div>
      </div>
      <div className="flex gap-1.5 rounded-xl border border-line bg-surface-base p-1">
        {SEARCH_TIMELINE_RANGE_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            disabled={!hasQuery}
            onClick={() => onRangeChange(value)}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-xs transition-colors",
              range === value ? "border-line bg-surface-hi" : "border-transparent",
              hasQuery
                ? range === value
                  ? "cursor-pointer text-ink"
                  : "cursor-pointer text-ink-3 hover:text-ink"
                : "text-ink-5",
            )}
          >
            {t.ranges[value]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchTimelineHero;
