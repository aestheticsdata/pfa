import type { OwnedTarget } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import { GroupNotFound } from "@contexts/spending/domain/spending-errors";
import { Injectable } from "@nestjs/common";

/**
 * The lines become separate spendings again. Their stored labels already read "<group> — <detail>",
 * and they keep the group's receipt — which thereby becomes a receipt shared between them.
 */
@Injectable()
export class UngroupSpendingGroup {
  constructor(private readonly groups: SpendingGroupRepository) {}

  async execute(target: OwnedTarget): Promise<{ spendingIDs: string[] }> {
    const group = await this.groups.byId(target.id, target.ownerId);
    if (!group) throw new GroupNotFound();

    const spendingIDs = group.ungroup();
    await this.groups.dissolve(group);
    return { spendingIDs };
  }
}
