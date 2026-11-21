import type { DomainEvent } from "@shared-kernel/interfaces/sharedKernelTypes";

/**
 * Hands domain events on to whoever reacts to them (PFA-278): a driven port. A use case publishes
 * what its aggregate recorded **after** the save, so a handler never sees a change that was rolled
 * back. One process, one database: the adapter is in-process today; a transactional outbox would be
 * another adapter behind this same port (see docs/ddd-hexagonal.md §10.3).
 */
export abstract class DomainEventPublisher {
  abstract publish(events: DomainEvent[]): Promise<void>;
}
