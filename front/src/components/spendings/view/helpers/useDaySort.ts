import { useMemo, useState } from "react";
import orderBy from "lodash/orderBy";

import type { SpendingListItem } from "@components/spendings/types";

export type DaySortField = "label" | "category" | "amount";
type SortDir = "asc" | "desc";

interface DaySortState {
  field: DaySortField | null;
  dir: SortDir;
}

/**
 * Per-day-card sort with EXPOSED state (field + direction), so the new
 * Dépenses day cards can render the active button + arrow glyph. Same
 * sorting behaviour as `useClickSort` but returns the current state.
 *
 * (The shared `useClickSort` — still used by the recurrings/overview
 * `SpendingDayItem` — does not expose its state, so this is kept separate
 * rather than modifying shared code.)
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
        [
          (s) => (("category" in s ? s.category : "") ?? "").toLowerCase(),
          (s) => Number(s.amount),
        ],
        [sort.dir, "desc"],
      );
    }
    return orderBy(spendings, (s) => Number(s.amount), [sort.dir]);
  }, [spendings, sort]);

  return { field: sort.field, dir: sort.dir, onSort, sorted };
};

export default useDaySort;
