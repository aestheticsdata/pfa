"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { euro } from "@lib/format";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";

import type { SpendingItem } from "@components/spendings/types";

interface SpendingSearchResultRowProps {
  spending: SpendingItem;
  onSelect: (spending: SpendingItem) => void;
}

/**
 * One result line in the whole-history search modal (COS-114): date · colour pill
 * + label · category tag · amount. Clicking it opens the edit modal. Deliberately
 * standalone (no useSpendings / hover actions) — unlike the week-scoped
 * SpendingTxRow it isn't tied to the day-card grid or delete flow.
 */
const SpendingSearchResultRow = ({ spending, onSelect }: SpendingSearchResultRowProps) => {
  const color = spending.categoryColor || CATEGORY_FALLBACK;
  const category = spending.category ?? null;
  const dateLabel = format(parseISO(spending.date), "d MMM", { locale: fr });

  return (
    <button
      type="button"
      onClick={() => onSelect(spending)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-hi"
    >
      <span className="w-12 shrink-0 text-xs text-ink-4">{dateLabel}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: color }}
        />
        <span className="truncate">{spending.label}</span>
      </span>
      {category && (
        <span
          className="shrink-0 text-xs font-medium"
          style={{ color }}
        >
          {category}
        </span>
      )}
      <span className="w-20 shrink-0 text-right text-sm font-semibold text-ink tabular-nums">
        {euro(spending.amount)} €
      </span>
    </button>
  );
};

export default SpendingSearchResultRow;
