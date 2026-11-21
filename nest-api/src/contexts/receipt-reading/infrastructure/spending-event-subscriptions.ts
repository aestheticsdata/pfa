import { ReleaseReceiptsHandler } from "@contexts/receipt-reading/application/release-receipts.handler";
import { isReceiptsLetGo, RECEIPT_RELEASING_EVENTS } from "@contexts/spending/domain/spending-events";
import { InProcessEventBus } from "@infrastructure/events/in-process-event-bus";
import { Injectable, OnModuleInit } from "@nestjs/common";

/** Subscribes receipt reading to the Spending context's events when the module starts (PFA-278). */
@Injectable()
export class SpendingEventSubscriptions implements OnModuleInit {
  constructor(
    private readonly bus: InProcessEventBus,
    private readonly releaseReceipts: ReleaseReceiptsHandler,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(RECEIPT_RELEASING_EVENTS, async (event) => {
      if (isReceiptsLetGo(event)) await this.releaseReceipts.handle(event);
    });
  }
}
