import { randomUUID } from "node:crypto";
import { resolveLineCategories } from "@contexts/spending/application/group-line-categories";
import type { EditSpendingGroupCommand } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";

import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import { GroupNotFound } from "@contexts/spending/domain/spending-errors";
import { Injectable } from "@nestjs/common";
import { DomainEventPublisher } from "@shared-kernel/domain-event-publisher";

@Injectable()
export class EditSpendingGroup {
  constructor(
    private readonly groups: SpendingGroupRepository,
    private readonly categories: CategoryLookup,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: EditSpendingGroupCommand): Promise<{ success: boolean }> {
    const group = await this.groups.byId(command.groupId, command.ownerId);
    if (!group) throw new GroupNotFound();
    group.assertHolds(command.lines.flatMap((line) => line.ID ?? []));

    const categoryIds = await resolveLineCategories(command.lines, command.ownerId, this.categories);
    group.edit({
      label: command.label,
      lines: command.lines.map((line, i) => ({
        id: line.ID ?? randomUUID(),
        isNew: !line.ID,
        amount: line.amount,
        categoryId: categoryIds[i],
        detail: line.detail,
      })),
    });
    await this.groups.save(group);
    await this.events.publish(group.pullEvents());
    return { success: true };
  }
}
