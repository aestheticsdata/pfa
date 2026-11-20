import type {
  ClosedRange,
  ExceptionalFields,
  ExceptionalItem,
  NewExceptional,
  OwnedRecord,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

/** The user's exceptional expenses (PFA-276). */
export abstract class ExceptionalRepository {
  abstract list(ownerId: string, year: ClosedRange | null): Promise<ExceptionalItem[]>;
  abstract dates(ownerId: string): Promise<Date[]>;
  abstract add(exceptional: NewExceptional, ownerId: string): Promise<string>;
  abstract edit(exceptional: OwnedRecord, fields: ExceptionalFields): Promise<boolean>;
  abstract remove(exceptional: OwnedRecord): Promise<boolean>;
}
