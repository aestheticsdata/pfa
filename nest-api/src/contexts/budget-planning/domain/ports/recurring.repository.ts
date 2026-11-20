import type {
  DayRange,
  MonthSpan,
  OwnedRecord,
  RecurringCharge,
  RecurringEdit,
  RecurringItem,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

/** A month's recurring charges (PFA-276), one row per month. */
export abstract class RecurringRepository {
  /** The month's rows as the screen lists them, biggest first. */
  abstract month(start: Date, ownerId: string): Promise<RecurringItem[]>;
  abstract chargesOf(start: Date, ownerId: string): Promise<RecurringCharge[]>;
  abstract total(range: DayRange, ownerId: string): Promise<number>;
  abstract add(charges: (RecurringCharge & MonthSpan)[], ownerId: string): Promise<void>;
  /** False when the row is not the user's. */
  abstract edit(recurring: OwnedRecord, edit: RecurringEdit): Promise<boolean>;
  abstract remove(recurring: OwnedRecord): Promise<boolean>;
}
