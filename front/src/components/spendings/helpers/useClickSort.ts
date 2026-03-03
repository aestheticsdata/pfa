import { useState } from "react";
import _ from "lodash";
import {
  SORT_BY_LABEL,
  SORT_BY_CATEGORY,
  SORT_BY_AMOUNT,
} from "@components/spendings/helpers/sortConstants";

import type { SpendingListItem } from "@components/spendings/types";

type SortOrder = "asc" | "desc";
type SortField = typeof SORT_BY_LABEL | typeof SORT_BY_CATEGORY | typeof SORT_BY_AMOUNT;

const useClickSort = () => {
  const [spendingsByDaySorted, setSpendingsByDaySorted] = useState<SpendingListItem[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const onClickSort = (name: SortField) => {
    let sorted: SpendingListItem[] = [];

    if (name === SORT_BY_LABEL) {
      sorted = _.orderBy(spendingsByDaySorted, (entry) => entry.label, [sortOrder]);
    }

    if (name === SORT_BY_CATEGORY) {
      sorted = _.orderBy(
        spendingsByDaySorted,
        (entry) => ("category" in entry ? entry.category : "") ?? "",
        [sortOrder]
      );
    }

    if (name === SORT_BY_AMOUNT) {
      sorted = _.orderBy(spendingsByDaySorted, (entry) => entry.amount, [sortOrder]);
    }

    setSpendingsByDaySorted(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return {
    onClickSort,
    spendingsByDaySorted,
    setSpendingsByDaySorted,
  };
}

export default useClickSort;
