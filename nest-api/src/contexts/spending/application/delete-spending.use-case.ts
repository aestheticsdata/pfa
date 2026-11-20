import type { OwnedTarget } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import { ReceiptReleaser } from "@contexts/spending/domain/ports/receipt-releaser";
import { SpendingRepository } from "@contexts/spending/domain/ports/spending.repository";
import { SpendingNotFound } from "@contexts/spending/domain/spending-errors";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DeleteSpending {
  constructor(
    private readonly spendings: SpendingRepository,
    private readonly receipts: ReceiptReleaser,
  ) {}

  async execute(target: OwnedTarget): Promise<{ success: boolean }> {
    const spending = await this.spendings.byId(target.id, target.ownerId);
    if (!spending) throw new SpendingNotFound();

    await this.spendings.remove(spending);
    // Other rows may still share the receipt (PFA-189): only an orphan goes.
    await this.receipts.release(target.ownerId, [spending.receipt]);
    return { success: true };
  }
}
