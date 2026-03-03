import { useState } from "react";
import _ from "lodash";
import {
  SORT_BY_LABEL,
  SORT_BY_CATEGORY,
  SORT_BY_AMOUNT,
} from "@components/spendings/helpers/sortConstants";

import type { SpendingCompoundType } from "@components/spendings/types";

const useClickSort = () => {
  const [spendingsByDaySorted, setSpendingsByDaySorted] = useState<any>([] as unknown as SpendingCompoundType);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const onClickSort = (name: string) => {
    let tempArr: any[] = [];

    // array of spending use [].total and [].date, lodash orderBy remove these two keys
    let preserveArrayKeys = (() => {
      const keys = Object.keys(spendingsByDaySorted).filter((k) => isNaN(parseInt(k, 10)));
      return keys.map(k => ({ [k]: spendingsByDaySorted[k] }));
    })();
    ///////////////////////////////////////////////////////////////////////////////////

    setSortOrder('asc');

    if (name === SORT_BY_LABEL) {
      tempArr = _.orderBy(spendingsByDaySorted, o => o.label, [sortOrder]);
    }

    if (name === SORT_BY_CATEGORY) {
      tempArr = _.orderBy(spendingsByDaySorted, o => o.category, [sortOrder]);
    }

    if (name === SORT_BY_AMOUNT) {
      tempArr = _.orderBy(spendingsByDaySorted, o => parseFloat(o.amount), [sortOrder]);
    }

    // array of spending use [].total and [].date, lodash orderBy remove these two keys
    for (const i of preserveArrayKeys) {
      const tempObjKey = Object.keys(i)[0];
      tempArr[tempObjKey as unknown as number] = (i as Record<string, unknown>)[tempObjKey];
    }
    ///////////////////////////////////////////////////////////////////////////////////

    setSpendingsByDaySorted(tempArr);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return {
    onClickSort,
    spendingsByDaySorted,
    setSpendingsByDaySorted,
  };
}

export default useClickSort;
