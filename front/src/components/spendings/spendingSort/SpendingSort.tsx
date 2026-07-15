import spendingsText from "@components/spendings/config/text";
import { SORT_BY_AMOUNT, SORT_BY_CATEGORY, SORT_BY_LABEL } from "@components/spendings/helpers/sortConstants";
import { ArrowDownUp } from "lucide-react";

type SortField = typeof SORT_BY_LABEL | typeof SORT_BY_CATEGORY | typeof SORT_BY_AMOUNT;

interface SpendingSortProps {
  recurringType?: boolean;
  onClickSort: (field: SortField) => void;
}

const SortPill = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1 bg-surface-hi hover:bg-surface-hover rounded text-ink-3 text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
  >
    {label}
    <ArrowDownUp className="w-3 h-3" />
  </button>
);

const SpendingSort = ({ recurringType, onClickSort }: SpendingSortProps) => {
  const { sortItem } = spendingsText;
  return (
    <div className="flex gap-2">
      <SortPill
        label={sortItem.label}
        onClick={() => onClickSort(SORT_BY_LABEL)}
      />
      {!recurringType && (
        <SortPill
          label={sortItem.category}
          onClick={() => onClickSort(SORT_BY_CATEGORY)}
        />
      )}
      <SortPill
        label={sortItem.amount}
        onClick={() => onClickSort(SORT_BY_AMOUNT)}
      />
    </div>
  );
};

export default SpendingSort;
