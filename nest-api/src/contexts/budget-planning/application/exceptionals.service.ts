import type { ExceptionalInput } from "@contexts/budget-planning/application/interfaces/budgetCommandTypes";
import { ExceptionalNotFound } from "@contexts/budget-planning/domain/budget-errors";
import { yearSpan, yearsOf } from "@contexts/budget-planning/domain/exceptional-years";
import type {
  ExceptionalFields,
  ExceptionalItem,
  OwnedRecord,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { ExceptionalRepository } from "@contexts/budget-planning/domain/ports/exceptional.repository";
import { Injectable } from "@nestjs/common";

/** The fields an exceptional is written with; its category a frozen name and colour. */
const fieldsOf = (input: ExceptionalInput): ExceptionalFields => ({
  date: new Date(input.date),
  label: input.label,
  description: input.description ?? null,
  amount: input.amount,
  categoryName: input.categoryName ?? null,
  categoryColor: input.categoryColor ?? null,
});

/** Rare, large expenses (PFA-276), kept apart from the month's spendings. */
@Injectable()
export class ExceptionalsService {
  constructor(private readonly exceptionals: ExceptionalRepository) {}

  list(ownerId: string, year?: string): Promise<ExceptionalItem[]> {
    return this.exceptionals.list(ownerId, yearSpan(year));
  }

  async years(ownerId: string): Promise<number[]> {
    return yearsOf(await this.exceptionals.dates(ownerId));
  }

  async add(input: ExceptionalInput, ownerId: string): Promise<{ message: string; ID: string }> {
    const ID = await this.exceptionals.add({ ...fieldsOf(input), currency: input.currency ?? null }, ownerId);
    return { message: "new exceptional added", ID };
  }

  async edit(exceptional: OwnedRecord, input: ExceptionalInput): Promise<{ success: boolean }> {
    if (!(await this.exceptionals.edit(exceptional, fieldsOf(input)))) throw new ExceptionalNotFound();
    return { success: true };
  }

  async remove(exceptional: OwnedRecord): Promise<{ success: boolean }> {
    if (!(await this.exceptionals.remove(exceptional))) throw new ExceptionalNotFound();
    return { success: true };
  }
}
