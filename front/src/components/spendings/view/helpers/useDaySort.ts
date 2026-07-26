import orderBy from "lodash/orderBy";
import { useMemo, useState } from "react";

import type { SpendingListItem } from "@components/spendings/interfaces/spendingListTypes";

export type DaySortField = "label" | "category" | "amount";
type SortDir = "asc" | "desc";

interface DaySortState {
  field: DaySortField | null;
  dir: SortDir;
}

/**
 * Per-day-card sort with EXPOSED state (field + direction), so the
 * Spendings day cards can render the active button + arrow glyph.
 */
const useDaySort = (spendings: SpendingListItem[]) => {
  const [sort, setSort] = useState<DaySortState>({ field: null, dir: "asc" });

  const onSort = (field: DaySortField) => {
    setSort((current) => {
      if (current.field !== field) {
        // amount defaults to descending (biggest first), like the design
        return { field, dir: field === "amount" ? "desc" : "asc" };
      }
      return { field, dir: current.dir === "asc" ? "desc" : "asc" };
    });
  };

  const sorted = useMemo(() => {
    if (!sort.field) {
      return spendings;
    }
    if (sort.field === "label") {
      return orderBy(spendings, (s) => s.label?.toLowerCase() ?? "", [sort.dir]);
    }
    if (sort.field === "category") {
      return orderBy(
        spendings,
        [(s) => (("category" in s ? s.category : "") ?? "").toLowerCase(), (s) => Number(s.amount)],
        [sort.dir, "desc"],
      );
    }
    return orderBy(spendings, (s) => Number(s.amount), [sort.dir]);
  }, [spendings, sort]);

  return { field: sort.field, dir: sort.dir, onSort, sorted };
};

export default useDaySort;
