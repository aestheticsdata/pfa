import { SORT_BY_CATEGORY, SORT_BY_LABEL } from "@components/spendings/helpers/sortConstants";
import _ from "lodash";
import { useState } from "react";

import type { SORT_BY_AMOUNT } from "@components/spendings/helpers/sortConstants";
import type { SpendingListItem } from "@components/spendings/types";

type SortOrder = "asc" | "desc";
type SortField = typeof SORT_BY_LABEL | typeof SORT_BY_CATEGORY | typeof SORT_BY_AMOUNT;
type SortState = {
  field: SortField | null;
  order: SortOrder;
};

const getSortedSpendings = (spendings: SpendingListItem[], { field, order }: SortState) => {
  if (!field) {
    return spendings;
  }

  if (field === SORT_BY_LABEL) {
    return _.orderBy(spendings, (entry) => entry.label, [order]);
  }

  if (field === SORT_BY_CATEGORY) {
    return _.orderBy(spendings, (entry) => ("category" in entry ? entry.category : "") ?? "", [order]);
  }

  return _.orderBy(spendings, (entry) => entry.amount, [order]);
};

const useClickSort = (spendings: SpendingListItem[]) => {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    order: "asc",
  });

  const onClickSort = (name: SortField) => {
    setSortState((current) => {
      if (current.field !== name) {
        return { field: name, order: "asc" };
      }

      return {
        field: name,
        order: current.order === "asc" ? "desc" : "asc",
      };
    });
  };

  const spendingsByDaySorted = getSortedSpendings(spendings, sortState);

  return {
    onClickSort,
    spendingsByDaySorted,
  };
};

export default useClickSort;
