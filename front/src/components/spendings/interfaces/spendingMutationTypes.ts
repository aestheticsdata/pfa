import type { SpendingMutationPayload } from "@src/schemas/spendings";

// Input of the create-spending mutation: the payload plus the optional receipt
// picked in the modal, uploaded right after the row is created (PFA-5).
export interface CreateSpendingInput {
  spendingEdited: SpendingMutationPayload;
  receiptFile?: File | null;
}
