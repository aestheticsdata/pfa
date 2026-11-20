import { resolveCategory } from "@contexts/spending/application/category-resolution";
import type { ReviseSpendingCommand } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import { revisedCategory } from "@contexts/spending/domain/category-choice";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";
import { SpendingRepository } from "@contexts/spending/domain/ports/spending.repository";
import { SpendingNotFound } from "@contexts/spending/domain/spending-errors";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ReviseSpending {
  constructor(
    private readonly spendings: SpendingRepository,
    private readonly categories: CategoryLookup,
  ) {}

  async execute(command: ReviseSpendingCommand): Promise<{ success: boolean }> {
    const spending = await this.spendings.byId(command.spendingId, command.ownerId);
    if (!spending) throw new SpendingNotFound();

    const choice = revisedCategory(command.category, spending.categoryId);
    const categoryId = await resolveCategory(choice, command.ownerId, this.categories);
    spending.revise({ label: command.label, amount: command.amount, categoryId });
    await this.spendings.save(spending);
    return { success: true };
  }
}
