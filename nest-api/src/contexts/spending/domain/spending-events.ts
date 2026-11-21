import type { ReceiptsLetGo } from "@contexts/spending/domain/interfaces/spendingTypes";
import type { DomainEvent } from "@shared-kernel/interfaces/sharedKernelTypes";

/**
 * What the Spending context tells the others (PFA-278), named in the past tense. Each event lists
 * the receipt files the change may have orphaned: the receipt context, which knows who else holds
 * a file, decides what goes.
 */
export const SPENDING_EVENT = {
  spendingDeleted: "spending.spendingDeleted",
  groupDeleted: "spending.groupDeleted",
  groupLinesRemoved: "spending.groupLinesRemoved",
  spendingsMerged: "spending.spendingsMerged",
} as const;

/** Every spending event: they all let receipts go. */
export const RECEIPT_RELEASING_EVENTS = Object.values(SPENDING_EVENT);

/** A spending event, as a subscriber receives it from the bus. */
export function isReceiptsLetGo(event: DomainEvent): event is ReceiptsLetGo {
  return (RECEIPT_RELEASING_EVENTS as string[]).includes(event.name) && "receipts" in event;
}
