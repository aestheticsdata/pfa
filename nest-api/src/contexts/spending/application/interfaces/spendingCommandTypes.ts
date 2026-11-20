import type { CategoryPick } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

export interface RecordSpendingCommand {
  ownerId: string;
  date: string;
  label: string;
  amount: number;
  currency: string;
  category?: CategoryPick;
}

export interface ReviseSpendingCommand {
  ownerId: string;
  spendingId: string;
  label: string;
  amount: number;
  category?: CategoryPick;
}

/** A spending, a group: what is acted on, and whose it is. */
export interface OwnedTarget {
  ownerId: string;
  id: string;
}

export interface GroupLineInput {
  ID?: string;
  detail?: string;
  amount: number;
  category?: CategoryPick;
}

export interface CreateSpendingGroupCommand {
  ownerId: string;
  date: string;
  label: string;
  currency: string;
  lines: GroupLineInput[];
}

export interface EditSpendingGroupCommand {
  ownerId: string;
  groupId: string;
  label: string;
  lines: GroupLineInput[];
}

export interface MergeSpendingsCommand {
  ownerId: string;
  label: string;
  lines: { spendingID: string; detail?: string }[];
}
