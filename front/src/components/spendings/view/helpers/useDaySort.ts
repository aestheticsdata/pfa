import orderBy from "lodash/orderBy";
import { useState } from "react";

import type { DaySortable } from "@components/spendings/interfaces/spendingGroupTypes";

export type DaySortField = "label" | "category" | "amount";
type SortDir = "asc" | "desc";

interface DaySortState {
  field: DaySortField | null;
  dir: SortDir;
}

const sortSpendings = <T extends DaySortable>(spendings: T[], sort: DaySortState) => {
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
};

/**
 * Per-day-card sort with EXPOSED state (field + direction), so the
 * Spendings day cards can render the active button + arrow glyph.
 */
const useDaySort = <T extends DaySortable>(spendings: T[]) => {
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

  return { field: sort.field, dir: sort.dir, onSort, sorted: sortSpendings(spendings, sort) };
};

export default useDaySort;
