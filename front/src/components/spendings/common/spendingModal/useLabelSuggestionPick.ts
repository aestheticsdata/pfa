import useDebouncedValue from "@components/spendings/search/useDebouncedValue";
import useLabelSuggestions from "@components/spendings/services/useLabelSuggestions";
import { useState } from "react";

import type { LabelSuggestionPickInput } from "@components/spendings/interfaces/spendingModalTypes";
import type { LabelSuggestion } from "@src/schemas/spendings";

// Debounce the label input before hitting the suggestions endpoint, so a
// fast-typed label makes one request on pause, not one per keystroke (matches
// the whole-history search, COS-114).
const LABEL_SUGGESTIONS_DEBOUNCE_MS = 250;

/**
 * Label suggestions from the user's real past labels (COS-23), and picking one:
 * it fills the label and, when its category is one of the options, selects it.
 */
const useLabelSuggestionPick = ({
  initialLabel,
  enabled,
  setValue,
  categoryOptions,
  setSelectedCategory,
}: LabelSuggestionPickInput) => {
  const [labelQuery, setLabelQuery] = useState(initialLabel);
  const debouncedLabelQuery = useDebouncedValue(labelQuery, LABEL_SUGGESTIONS_DEBOUNCE_MS);
  const labelSuggestions = useLabelSuggestions(debouncedLabelQuery, enabled);

  const applySuggestion = (suggestion: LabelSuggestion) => {
    setValue("spendingLabel", suggestion.label, { shouldValidate: true });
    setLabelQuery(suggestion.label);
    const category = suggestion.category;
    if (!category) return;
    const match = categoryOptions.find((c) => c.name.toLowerCase() === category.toLowerCase());
    if (match) {
      setSelectedCategory(match);
    }
  };

  return { labelSuggestions, applySuggestion, setLabelQuery };
};

export default useLabelSuggestionPick;
