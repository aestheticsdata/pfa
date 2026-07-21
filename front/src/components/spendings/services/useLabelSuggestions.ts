import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { LabelSuggestionListSchema } from "@src/schemas/spendings";
import { useQuery } from "@tanstack/react-query";

import type { LabelSuggestion } from "@src/schemas/spendings";

/**
 * Label autocomplete for the spending modal (COS-23): the user's own past
 * spending labels ranked by frequency and filtered by the typed prefix, each
 * with its most-used category so selecting one can pre-fill it. An empty query
 * returns the most frequent labels (shown on open). Hits
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
    // Autocomplete is a nice-to-have inside the spending modal — a failure just
    // means no suggestions, never an error screen (opts out of the global
    // throwOnError).
    throwOnError: false,
  });

  return data ?? [];
};

export default useLabelSuggestions;
