import type { OwnedTarget } from "@contexts/spending/application/interfaces/spendingCommandTypes";

import { SpendingRepository } from "@contexts/spending/domain/ports/spending.repository";
import { SpendingNotFound } from "@contexts/spending/domain/spending-errors";
import { Injectable } from "@nestjs/common";
import { DomainEventPublisher } from "@shared-kernel/domain-event-publisher";

@Injectable()
export class DeleteSpending {
  constructor(
    private readonly spendings: SpendingRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(target: OwnedTarget): Promise<{ success: boolean }> {
    const spending = await this.spendings.byId(target.id, target.ownerId);
    if (!spending) throw new SpendingNotFound();

    spending.discard();
    await this.spendings.remove(spending);
    // Other rows may still share the receipt (PFA-189): the receipt context lets only an orphan go.
    await this.events.publish(spending.pullEvents());
    return { success: true };
  }
}
