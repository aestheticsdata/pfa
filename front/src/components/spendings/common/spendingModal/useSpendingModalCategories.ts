import useCategoryStats from "@components/categories/services/useCategoryStats";
import { rankFrequentCategories } from "@components/spendings/common/spendingModal/rankFrequentCategories";
import useCategories from "@components/spendings/services/useCategories";
import { format, startOfYear } from "date-fns";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";

/** The category picker's options, and the "Frequent" quick-picks ranked among them. */
const useSpendingModalCategories = () => {
  const { categories } = useCategories();
  // Per-category usage scoped to the current year to date (client-side "today",
  // cf COS-73) — ranks the "Frequent" quick-picks on recent habits, not
  // all-time cumulative usage (COS-137). Never blocks the modal: while stats load
  // (or on error) the section is simply empty until real usage arrives.
  const now = new Date();
  const frequentRange = { from: format(startOfYear(now), "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
  const { categoryStats } = useCategoryStats(frequentRange);

  const categoryOptions: CategoryOption[] = (categories ?? []).map((c) => ({
    ID: c.ID,
    userID: c.userID,
    name: c.name,
    color: c.color,
  }));

  return { categoryOptions, frequentCategories: rankFrequentCategories(categoryOptions, categoryStats?.byCategory) };
};

export default useSpendingModalCategories;
