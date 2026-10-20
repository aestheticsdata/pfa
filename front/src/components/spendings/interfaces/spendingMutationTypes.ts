import type { SpendingMutationPayload } from "@src/schemas/spendings";

// Input of the create-spending mutation: the payload plus the optional receipt
// picked in the modal, uploaded right after the row is created (PFA-5).
export interface CreateSpendingInput {
  spendingEdited: SpendingMutationPayload;
  receiptFile?: File | null;
}

// Body of "copy last month's recurrings": the target month's bounds and the previous month's.
export interface RecurringCopyDates {
  start: string;
  end: string;
  previousMonthStart: string;
  previousMonthEnd: string;
}
