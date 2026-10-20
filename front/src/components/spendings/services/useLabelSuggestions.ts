import { labelSuggestionsQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { LabelSuggestion } from "@src/schemas/spendings";

/**
 * Label autocomplete for the spending modal (COS-23): the user's own past
 * spending labels ranked by frequency and filtered by the typed prefix, each
 * with its most-used category so selecting one can pre-fill it. An empty query
 * — or a prefix matching nothing — returns the most frequent labels, so the row
 * is never empty as long as the user has history (COS-159). Hits
 * `GET /spendings/label-suggestions`. Debouncing is the caller's job; pass
 * `enabled: false` (recurrings never show suggestions) to skip the request.
 */
const useLabelSuggestions = (query: string, enabled = true): LabelSuggestion[] => {
  const { privateRequest } = useRequestHelper();
  const trimmed = query.trim();

  const { data } = useQuery({
    ...labelSuggestionsQuery(privateRequest, trimmed),
    enabled,
    // Keep the previous chips on screen while the next query is in flight:
    // an empty gap between two keystrokes would flicker the row (COS-159).
    placeholderData: keepPreviousData,
  });

  return data ?? [];
};

export default useLabelSuggestions;
