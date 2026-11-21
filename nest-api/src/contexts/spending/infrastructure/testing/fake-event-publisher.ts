import { DomainEventPublisher } from "@shared-kernel/domain-event-publisher";
import type { DomainEvent } from "@shared-kernel/interfaces/sharedKernelTypes";

/** Records what was published (PFA-278). */
export class FakeEventPublisher extends DomainEventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}
