import type { DomainEvent } from "@shared-kernel/interfaces/sharedKernelTypes";

/**
 * The entry point of an aggregate (PFA-272): the only object allowed to change what it holds, so
 * it is where the invariants live. It records what happened; the use case hands the events on once
 * the aggregate is saved.
 */
export abstract class AggregateRoot {
  private events: DomainEvent[] = [];

  protected record<T extends DomainEvent>(event: T): void {
    this.events.push(event);
  }

  /** The events recorded since the last call, emptied as they are read. */
  pullEvents(): DomainEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }
}
