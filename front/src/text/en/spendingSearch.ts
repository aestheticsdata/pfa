import type frSpendingSearch from "@text/fr/spendingSearch";

const spendingSearch: typeof frSpendingSearch = {
  trigger: "Search for a spending",
  shortcutHint: "⌘K",
  title: "Search for a spending",
  placeholder: "Search for a spending…",
  hint: "Type at least 2 characters or pick a year",
  yearsAll: "All",
  loading: "Searching…",
  loadingMore: "Loading…",
  error: "Search failed. Try again.",
  noResults: "No spending matches",
  resultsCount: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
};

export default spendingSearch;
