import { randomUUID } from "node:crypto";
import { resolveCategory } from "@contexts/spending/application/category-resolution";
import type { RecordSpendingCommand } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import { chosenCategory } from "@contexts/spending/domain/category-choice";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";
import { SpendingRepository } from "@contexts/spending/domain/ports/spending.repository";
import { Spending } from "@contexts/spending/domain/spending";
import { Injectable } from "@nestjs/common";
import { CalendarDay } from "@shared-kernel/calendar-day";
import { Money } from "@shared-kernel/money";

@Injectable()
export class RecordSpending {
  constructor(
    private readonly spendings: SpendingRepository,
    private readonly categories: CategoryLookup,
  ) {}

  /** The ID lets the front chain the receipt upload on the row it just created (PFA-5). */
  async execute(command: RecordSpendingCommand): Promise<{ ID: string }> {
    const categoryId = await resolveCategory(chosenCategory(command.category), command.ownerId, this.categories);
    const spending = Spending.record({
      id: randomUUID(),
      ownerId: command.ownerId,
      date: CalendarDay.fromDate(new Date(command.date)),
      label: command.label,
      amount: Money.of(command.amount, command.currency),
      categoryId,
    });
    await this.spendings.add(spending);
    return { ID: spending.id };
  }
}
