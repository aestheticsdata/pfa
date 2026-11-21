import type { OwnedTarget } from "@contexts/spending/application/interfaces/spendingCommandTypes";

import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import { GroupNotFound } from "@contexts/spending/domain/spending-errors";
import { Injectable } from "@nestjs/common";
import { DomainEventPublisher } from "@shared-kernel/domain-event-publisher";

@Injectable()
export class DeleteSpendingGroup {
  constructor(
    private readonly groups: SpendingGroupRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(target: OwnedTarget): Promise<{ success: boolean }> {
    const group = await this.groups.byId(target.id, target.ownerId);
    if (!group) throw new GroupNotFound();

    group.discard();
    await this.groups.remove(group);
    await this.events.publish(group.pullEvents());
    return { success: true };
  }
}
