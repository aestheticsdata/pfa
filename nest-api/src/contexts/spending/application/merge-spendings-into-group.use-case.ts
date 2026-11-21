import { randomUUID } from "node:crypto";
import type { MergeSpendingsCommand } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import type { GroupCandidate } from "@contexts/spending/domain/interfaces/spendingTypes";

import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import { DuplicateSpending, SpendingNotFound } from "@contexts/spending/domain/spending-errors";
import { SpendingGroup } from "@contexts/spending/domain/spending-group";
import { Injectable } from "@nestjs/common";
import { DomainEventPublisher } from "@shared-kernel/domain-event-publisher";

@Injectable()
export class MergeSpendingsIntoGroup {
  constructor(
    private readonly groups: SpendingGroupRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: MergeSpendingsCommand): Promise<{ ID: string; invoicefile: string | null }> {
    const ids = command.lines.map((line) => line.spendingID);
    if (new Set(ids).size !== ids.length) throw new DuplicateSpending();

    const found = new Map((await this.groups.candidates(ids, command.ownerId)).map((c) => [c.id, c]));
    if (found.size !== ids.length) throw new SpendingNotFound();

    const group = SpendingGroup.merge({
      id: randomUUID(),
      ownerId: command.ownerId,
      label: command.label,
      // In the order sent: the first receipt found is the group's.
      candidates: command.lines.map((line) => ({
        ...(found.get(line.spendingID) as GroupCandidate),
        detail: line.detail,
      })),
    });
    await this.groups.save(group);
    await this.events.publish(group.pullEvents());
    return { ID: group.id, invoicefile: group.receipt };
  }
}
