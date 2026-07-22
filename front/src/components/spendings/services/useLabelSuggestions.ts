import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { LabelSuggestionListSchema } from "@src/schemas/spendings";
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
  const { user } = useAuth();
  const userID = user?.id;
  const trimmed = query.trim();

  const fetchSuggestions = async () => {
    const response = await privateRequest(`/spendings/label-suggestions?q=${encodeURIComponent(trimmed)}`);
    return LabelSuggestionListSchema.parse(response.data);
  };

  const { data } = useQuery({
    queryKey: [QUERY_KEYS.LABEL_SUGGESTIONS, trimmed],
    queryFn: fetchSuggestions,
    enabled: enabled && !!userID,
    retry: false,
    // Keep the previous chips on screen while the next query is in flight:
    // an empty gap between two keystrokes would flicker the row (COS-159).
    placeholderData: keepPreviousData,
    // Autocomplete is a nice-to-have inside the spending modal — a failure just
    // means no suggestions, never an error screen (opts out of the global
    // throwOnError).
    throwOnError: false,
  });

  return data ?? [];
};

export default useLabelSuggestions;
