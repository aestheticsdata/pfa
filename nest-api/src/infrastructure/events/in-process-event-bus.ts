import { Injectable } from "@nestjs/common";
import { DomainEventPublisher } from "@shared-kernel/domain-event-publisher";
import type { DomainEvent, DomainEventHandler } from "@shared-kernel/interfaces/sharedKernelTypes";

/**
 * The in-process adapter of the event port (PFA-278). Handlers run in order and are awaited: the
 * request answers once every reaction is done, and a failing handler fails the request — as the
 * direct calls it replaces did. Handlers must be idempotent: an event may be handled again.
 */
@Injectable()
export class InProcessEventBus extends DomainEventPublisher {
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  /** Called by a context's module at start-up for the events it reacts to. */
  subscribe(names: string[], handler: DomainEventHandler): void {
    for (const name of names) {
      this.handlers.set(name, [...(this.handlers.get(name) ?? []), handler]);
    }
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      for (const handler of this.handlers.get(event.name) ?? []) {
        await handler(event);
      }
    }
  }
}
