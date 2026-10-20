import SpendingSearchResultRow from "@components/spendings/search/SpendingSearchResultRow";
import useTranslations from "@i18n/useTranslations";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

interface SearchTimelineLatestProps {
  matches: SpendingItem[];
  onSelect: (spending: SpendingItem) => void;
}

/**
 * The term's newest matches over the WHOLE history, deliberately not clipped to the
 * displayed range: they answer "when did I last buy this?", a question the range
 * switcher must not truncate.
 */
const SearchTimelineLatest = ({ matches, onSelect }: SearchTimelineLatestProps) => {
  const { searchTimeline: t } = useTranslations("statistics");
  if (matches.length === 0) return null;

  return (
    <div className="mt-5">
      <h3 className="mb-2 text-2xs uppercase tracking-caps text-ink-3">{t.latestTitle}</h3>
      <div className="overflow-hidden rounded-xl border border-line-soft">
        {matches.map((item) => (
          <SpendingSearchResultRow
            key={item.ID}
            spending={item}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchTimelineLatest;
