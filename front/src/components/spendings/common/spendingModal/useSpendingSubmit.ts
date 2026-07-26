import { getRandomHexColor } from "@components/spendings/common/spendingModal/helpers";
import evaluateAmountExpression from "@lib/amountExpression";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";

import type { AuthUser } from "@auth/interfaces/authTypes";
import type { CategoryOption, SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type { SpendingListItem } from "@components/spendings/interfaces/spendingListTypes";
import type { SpendingMutationPayload } from "@src/schemas/spendings";

interface MutationLike<TPayload> {
  mutate: (payload: TPayload) => void;
}

interface CreateRecurringPayload {
  spendingEdited: SpendingMutationPayload;
  formattedMonth: { start: string; end: string };
}

interface UseSpendingSubmitOptions {
  user: AuthUser | null;
  spending: SpendingListItem | null;
  isEditing: boolean;
  recurringType: boolean;
  asRecurring: boolean;
  recurringMonth: Date;
  categoryOptions: CategoryOption[];
  selectedCategory: CategoryOption | null;
  comboboxQuery: string;
  createSpending: MutationLike<SpendingMutationPayload>;
  updateSpending: MutationLike<SpendingMutationPayload>;
  createRecurring: MutationLike<CreateRecurringPayload>;
  updateRecurring: MutationLike<SpendingMutationPayload>;
  closeModal: () => void;
}

const useSpendingSubmit = ({
  user,
  spending,
  isEditing,
  recurringType,
  asRecurring,
  recurringMonth,
  categoryOptions,
  selectedCategory,
  comboboxQuery,
  createSpending,
  updateSpending,
  createRecurring,
  updateRecurring,
  closeModal,
}: UseSpendingSubmitOptions) => {
  const onSubmit = (values: SpendingForm) => {
    if (!user) {
      console.error("User is not available");
      return;
    }

    const amountEvaluatedExpr = evaluateAmountExpression(values.spendingAmount);
    if (amountEvaluatedExpr === null) {
      return;
    }

    // Category resolution (legacy behaviour): an explicit pick wins; otherwise
    // whatever was typed in the combobox becomes the category — an existing one
    // if it matches, else a brand-new one created on the fly at submit. No
    // separate "create category" step.
    const trimmedQuery = comboboxQuery.trim();
    const resolvedCategory: CategoryOption | null = selectedCategory
      ? selectedCategory
      : trimmedQuery
        ? (categoryOptions.find((c) => c.name.toLowerCase() === trimmedQuery.toLowerCase()) ?? {
            ID: null,
            userID: user.id,
            name: trimmedQuery,
            color: getRandomHexColor(),
          })
        : null;

    const categoryPayload: CategoryOption = resolvedCategory ?? {
      ID: null,
      userID: user.id,
      name: "",
      color: null,
    };

    const spendingDateStr = !asRecurring ? values.spendingDate || format(new Date(), "yyyy-MM-dd") : null;

    const spendingEdited = {
      date: spendingDateStr,
      label: values.spendingLabel,
      amount: Number(amountEvaluatedExpr),
      category: categoryPayload,
      currency: user.baseCurrency,
      userID: user.id,
      id: spending?.ID,
    };

    // NOTE: a receiptFile attached here is NOT uploaded — receipt-at-creation is
    // visual only (see the MOCK note on the receipt state in SpendingModal.tsx).
    // De-mock tracked in COS-24.

    if (isEditing) {
      if (recurringType) {
        updateRecurring.mutate(spendingEdited);
      } else {
        updateSpending.mutate(spendingEdited);
      }
    } else {
      if (asRecurring) {
        const formattedMonth = {
          start: format(startOfMonth(recurringMonth), "yyyy-MM-dd"),
          end: format(endOfMonth(recurringMonth), "yyyy-MM-dd"),
        };
        createRecurring.mutate({ spendingEdited, formattedMonth });
      } else {
        createSpending.mutate(spendingEdited);
      }
    }

    closeModal();
  };

  return onSubmit;
};

export default useSpendingSubmit;
