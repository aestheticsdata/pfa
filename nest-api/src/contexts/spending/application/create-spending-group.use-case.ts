import { randomUUID } from "node:crypto";
import { resolveLineCategories } from "@contexts/spending/application/group-line-categories";
import type { CreateSpendingGroupCommand } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";
import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import { SpendingGroup } from "@contexts/spending/domain/spending-group";
import { Injectable } from "@nestjs/common";
import { CalendarDay } from "@shared-kernel/calendar-day";

@Injectable()
export class CreateSpendingGroup {
  constructor(
    private readonly groups: SpendingGroupRepository,
    private readonly categories: CategoryLookup,
  ) {}

  /** The IDs let the front chain the group's receipt upload (POST /spendings/receipts). */
  async execute(command: CreateSpendingGroupCommand): Promise<{ ID: string; spendingIDs: string[] }> {
    const categoryIds = await resolveLineCategories(command.lines, command.ownerId, this.categories);
    const group = SpendingGroup.create({
      id: randomUUID(),
      ownerId: command.ownerId,
      date: CalendarDay.fromDate(new Date(command.date)),
      label: command.label,
      currency: command.currency,
      lines: command.lines.map((line, i) => ({
        id: randomUUID(),
        amount: line.amount,
        categoryId: categoryIds[i],
        detail: line.detail,
      })),
    });
    await this.groups.save(group);
    return { ID: group.id, spendingIDs: group.lines().map((line) => line.id) };
  }
}
