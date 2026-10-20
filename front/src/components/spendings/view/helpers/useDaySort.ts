import { DAY_SORT_FIELD } from "@components/spendings/config/constants";
import { orderBy, SORT_DIR } from "@lib/orderBy";
import { useState } from "react";

import type { DaySortField } from "@components/spendings/interfaces/daySortTypes";
import type { DaySortable } from "@components/spendings/interfaces/spendingGroupTypes";
import type { SortDir } from "@lib/interfaces/orderByTypes";

interface DaySortState {
  field: DaySortField | null;
  dir: SortDir;
}

const sortSpendings = <T extends DaySortable>(spendings: T[], sort: DaySortState) => {
  if (!sort.field) {
    return spendings;
  }
  if (sort.field === DAY_SORT_FIELD.label) {
    return orderBy(spendings, [(s) => s.label?.toLowerCase() ?? ""], [sort.dir]);
  }
  if (sort.field === DAY_SORT_FIELD.category) {
    return orderBy(
      spendings,
      [(s) => (("category" in s ? s.category : "") ?? "").toLowerCase(), (s) => Number(s.amount)],
      [sort.dir, SORT_DIR.desc],
    );
  }
  return orderBy(spendings, [(s) => Number(s.amount)], [sort.dir]);
};

/**
 * Per-day-card sort with EXPOSED state (field + direction), so the
 * Spendings day cards can render the active button + arrow glyph.
 */
const useDaySort = <T extends DaySortable>(spendings: T[]) => {
  const [sort, setSort] = useState<DaySortState>({ field: null, dir: SORT_DIR.asc });

  const onSort = (field: DaySortField) => {
    setSort((current) => {
      if (current.field !== field) {
        // amount defaults to descending (biggest first), like the design
        return { field, dir: field === DAY_SORT_FIELD.amount ? SORT_DIR.desc : SORT_DIR.asc };
      }
      return { field, dir: current.dir === SORT_DIR.asc ? SORT_DIR.desc : SORT_DIR.asc };
    });
  };

  return { field: sort.field, dir: sort.dir, onSort, sorted: sortSpendings(spendings, sort) };
};

export default useDaySort;
