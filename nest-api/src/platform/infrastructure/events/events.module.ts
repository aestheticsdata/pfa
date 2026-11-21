import { InProcessEventBus } from "@infrastructure/events/in-process-event-bus";
import { Global, Module } from "@nestjs/common";
import { DomainEventPublisher } from "@shared-kernel/domain-event-publisher";

/** One bus for the whole process (PFA-278): use cases publish to the port, modules subscribe here. */
@Global()
@Module({
  providers: [InProcessEventBus, { provide: DomainEventPublisher, useExisting: InProcessEventBus }],
  exports: [InProcessEventBus, DomainEventPublisher],
})
export class EventsModule {}
