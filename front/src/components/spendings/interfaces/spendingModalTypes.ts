import type { CategoryOption, SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type { GroupDayEntry } from "@components/spendings/interfaces/spendingGroupTypes";
import type { SpendingListItem } from "@components/spendings/interfaces/spendingListTypes";
import type { MonthRange } from "@lib/interfaces/dateRangeTypes";
import type { UseFormSetValue } from "react-hook-form";

export interface SpendingModalProps {
  date?: Date;
  closeModal: () => void;
  spending: SpendingListItem | null;
  recurringType?: boolean;
  isEditing: boolean;
  month?: MonthRange | null;
  /** A group to edit (PFA-189) — the modal then opens in group mode. */
  group?: GroupDayEntry | null;
}

/** What the label-suggestion pick needs from the modal (PFA-250). */
export interface LabelSuggestionPickInput {
  initialLabel: string;
  /** Never fetched for recurrings, which don't show suggestions. */
  enabled: boolean;
  setValue: UseFormSetValue<SpendingForm>;
  categoryOptions: CategoryOption[];
  setSelectedCategory: (category: CategoryOption) => void;
}
