import format from "date-fns/format";

import type { AuthUser } from "@auth/interfaces/authTypes";
import type { SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type {
  CreateSpendingGroupInput,
  GroupDayEntry,
  SpendingGroupLinePayload,
  UpdateSpendingGroupInput,
} from "@components/spendings/interfaces/spendingGroupTypes";

interface MutationLike<TPayload> {
  mutate: (payload: TPayload) => void;
}

interface UseGroupSubmitOptions {
  user: AuthUser | null;
  /** The group being edited, or null when creating one. */
  group: GroupDayEntry | null;
  validateLines: () => SpendingGroupLinePayload[] | null;
  receiptFile: File | null;
  createGroup: MutationLike<CreateSpendingGroupInput>;
  updateGroup: MutationLike<UpdateSpendingGroupInput>;
  closeModal: () => void;
}

/** Submit of the spending modal in group mode (PFA-189): create or save a group. */
const useGroupSubmit = ({
  user,
  group,
  validateLines,
  receiptFile,
  createGroup,
  updateGroup,
  closeModal,
}: UseGroupSubmitOptions) => {
  const onSubmit = (values: SpendingForm) => {
    if (!user) {
      console.error("User is not available");
      return;
    }
    const lines = validateLines();
    if (!lines) {
      return;
    }
    const label = values.spendingLabel.trim();

    if (group) {
      updateGroup.mutate({ ID: group.ID, label, lines });
    } else {
      createGroup.mutate({
        date: values.spendingDate || format(new Date(), "yyyy-MM-dd"),
        label,
        currency: user.baseCurrency,
        lines,
        receiptFile,
      });
    }
    closeModal();
  };

  return onSubmit;
};

export default useGroupSubmit;
