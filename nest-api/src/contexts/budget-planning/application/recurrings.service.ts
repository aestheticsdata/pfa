import { CategoriesService } from "@contexts/budget-planning/application/categories.service";
import type {
  CopiedMonth,
  NewRecurringInput,
  RecurringEditInput,
} from "@contexts/budget-planning/application/interfaces/budgetCommandTypes";
import { RecurringNotFound } from "@contexts/budget-planning/domain/budget-errors";
import { chosenCategory } from "@contexts/budget-planning/domain/category-choice";
import type {
  CategoryPick,
  MonthSpan,
  OwnedRecord,
  RecurringItem,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { RecurringRepository } from "@contexts/budget-planning/domain/ports/recurring.repository";
import { carriedForward, drawnWindow, recurringOf } from "@contexts/budget-planning/domain/recurring-charges";
import { Injectable } from "@nestjs/common";

/** A month's recurring charges (PFA-276): one row per month, carried into the next. */
@Injectable()
export class RecurringsService {
  constructor(
    private readonly recurrings: RecurringRepository,
    private readonly categories: CategoriesService,
  ) {}

  month(start: string, ownerId: string): Promise<RecurringItem[]> {
    return this.recurrings.month(new Date(start), ownerId);
  }

  /** The real "déjà prélevé" (COS-49): the year's rows through the client's current month. */
  async drawn(year: string, month: string, ownerId: string): Promise<{ drawn: number }> {
    const window = drawnWindow(year, month);
    return { drawn: window ? await this.recurrings.total(window, ownerId) : 0 };
  }

  async add(input: NewRecurringInput): Promise<{ message: string }> {
    const categoryId = await this.categoryOf(input.category, input.ownerId);
    const recurring = recurringOf({
      start: new Date(input.start),
      end: new Date(input.end),
      label: input.label,
      amount: input.amount,
      currency: input.currency ?? null,
      categoryId,
    });
    await this.recurrings.add([recurring], input.ownerId);
    return { message: "new recurring added" };
  }

  async edit(recurring: OwnedRecord, input: RecurringEditInput): Promise<{ success: boolean }> {
    const categoryId = await this.categoryOf(input.category, recurring.ownerId);
    const edited = await this.recurrings.edit(recurring, { label: input.label, amount: input.amount, categoryId });
    if (!edited) throw new RecurringNotFound();
    return { success: true };
  }

  /** A new month starts with last month's charges. */
  async copy(copied: CopiedMonth): Promise<{ msg: string }> {
    const previous = await this.recurrings.chargesOf(new Date(copied.previousMonthStart), copied.ownerId);
    if (previous.length > 0) {
      const month: MonthSpan = { start: new Date(copied.start), end: new Date(copied.end) };
      await this.recurrings.add(carriedForward(previous, month), copied.ownerId);
    }
    return { msg: "recurrings copied" };
  }

  async remove(recurring: OwnedRecord): Promise<{ success: boolean }> {
    if (!(await this.recurrings.remove(recurring))) throw new RecurringNotFound();
    return { success: true };
  }

  private categoryOf(pick: CategoryPick | undefined, ownerId: string): Promise<string | null> {
    return this.categories.resolve(chosenCategory(pick), ownerId);
  }
}
