import { ArrowDownUp } from "lucide-react";
import spendingsText from "@components/spendings/config/text";
import {
  SORT_BY_LABEL,
  SORT_BY_CATEGORY,
  SORT_BY_AMOUNT,
} from "@components/spendings/helpers/sortConstants";

type SortField =
  | typeof SORT_BY_LABEL
  | typeof SORT_BY_CATEGORY
  | typeof SORT_BY_AMOUNT;

interface SpendingSortProps {
  recurringType?: boolean;
  onClickSort: (field: SortField) => void;
}

const SortPill = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1 bg-gray-700/60 hover:bg-gray-600/80 rounded text-gray-300 text-xs transition-colors inline-flex items-center gap-1"
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
