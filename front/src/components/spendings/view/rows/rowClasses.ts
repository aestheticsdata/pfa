import { cn } from "@lib/utils";

import type { EntryRowFlags } from "@components/spendings/interfaces/spendingGroupTypes";

/** A day-card row: label · tag · amount, hover surface drawn by `::before`. */
export const TX_ROW =
  "group relative grid grid-cols-[minmax(0,1fr)_auto_78px] items-center gap-3 border-t border-line-soft py-2.75 first:border-t-0 before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-px before:z-0 before:rounded-lg before:transition-colors before:duration-100 before:content-[''] hover:before:bg-surface-hi max-md:grid-cols-[minmax(0,1fr)_auto] max-md:grid-rows-[auto_auto] max-md:gap-y-1.5";

/**
 * Selection tick, shared-receipt highlight and post-grouping flash (PFA-189),
 * all on the row's `::before` surface.
 */
export const rowStateClass = (row: EntryRowFlags) =>
  cn(
    row.isSelecting && "cursor-pointer",
    row.isSelected && "before:bg-accent-bg hover:before:bg-accent-bg",
    row.isReceiptHighlighted && "before:bg-elec/7 before:ring-1 before:ring-elec/35 before:ring-inset",
    row.isFlashing && "before:animate-row-flash",
  );
