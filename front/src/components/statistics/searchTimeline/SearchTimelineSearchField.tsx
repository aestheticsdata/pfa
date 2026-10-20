import useTranslations from "@i18n/useTranslations";
import { Search, X } from "lucide-react";

interface SearchTimelineSearchFieldProps {
  term: string;
  /** null clears the term, which drops it from the URL. */
  onTermChange: (term: string | null) => void;
}

/** The widget's own search field, with a clear button. */
const SearchTimelineSearchField = ({ term, onTermChange }: SearchTimelineSearchFieldProps) => {
  const { searchTimeline: t } = useTranslations("statistics");

  return (
    <div className="mt-4.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 max-w-85 flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface-base px-3.5 py-2">
        <Search className="size-4 shrink-0 text-ink-4" />
        <input
          type="search"
          data-testid="search-timeline-input"
          value={term}
          onChange={(e) => onTermChange(e.target.value)}
          placeholder={t.placeholder}
          // The custom clear button replaces WebKit's native one — two ✕ side
          // by side otherwise.
          className="min-w-0 flex-1 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-ink-4 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {term !== "" && (
          <button
            type="button"
            onClick={() => onTermChange(null)}
            aria-label={t.clear}
            className="shrink-0 cursor-pointer text-ink-4 transition-colors hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchTimelineSearchField;
