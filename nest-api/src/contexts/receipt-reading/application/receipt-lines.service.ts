import type {
  OwnedSpending,
  ReceiptOwner,
  ReceiptProposal,
  SavedReceipt,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { ProductTypeCatalog } from "@contexts/receipt-reading/domain/ports/product-type-catalog";
import { ReceiptLinesRepository } from "@contexts/receipt-reading/domain/ports/receipt-lines.repository";
import { ReceiptTextReader } from "@contexts/receipt-reading/domain/ports/receipt-text-reader";
import { StoreDirectory } from "@contexts/receipt-reading/domain/ports/store-directory";
import { NoReceipt, SpendingNotFound } from "@contexts/receipt-reading/domain/receipt-errors";
import { parseReceiptPages, pickProposal } from "@contexts/receipt-reading/domain/receipt-text-parser";
import { Injectable } from "@nestjs/common";

/**
 * The line items and store of a spending's receipt (PFA-214, PFA-218, PFA-219): proposed by the
 * OCR, saved only once the user accepted them. Every I/O goes through a port (PFA-274).
 */
@Injectable()
export class ReceiptLinesService {
  // biome-ignore lint/complexity/useMaxParams: Nest injects each port as its own constructor parameter.
  constructor(
    private readonly lines: ReceiptLinesRepository,
    private readonly reader: ReceiptTextReader,
    private readonly stores: StoreDirectory,
    private readonly productTypes: ProductTypeCatalog,
  ) {}

  private async ownedSpending(target: OwnedSpending): Promise<ReceiptOwner> {
    const spending = await this.lines.spending(target);
    if (!spending) throw new SpendingNotFound();
    return spending;
  }

  async read(target: OwnedSpending): Promise<SavedReceipt> {
    const { store } = await this.ownedSpending(target);
    return { lines: await this.lines.lines(target.spendingId), store };
  }

  async save(target: OwnedSpending, receipt: SavedReceipt): Promise<SavedReceipt> {
    await this.ownedSpending(target);
    const typeIds = await this.productTypes.idsFor(receipt.lines, target.ownerId);
    const storeId =
      receipt.store === undefined
        ? undefined
        : receipt.store
          ? await this.stores.resolve(receipt.store, target.ownerId)
          : null;
    await this.lines.replace(target, {
      lines: receipt.lines.map((line, i) => ({ ...line, productTypeId: typeIds[i] })),
      storeId,
    });
    return this.read(target);
  }

  /** Reads the spending's receipt; nothing is stored until the user saves. */
  async propose(target: OwnedSpending): Promise<ReceiptProposal> {
    const { receipt } = await this.ownedSpending(target);
    if (!receipt) throw new NoReceipt();
    const readings = await this.reader.read({ ownerId: target.ownerId, file: receipt });
    const proposal = pickProposal(readings.map(parseReceiptPages));
    const store = await this.stores.recognise(proposal.store, target.ownerId);
    const lines = await this.productTypes.link({ lines: proposal.lines, ownerId: target.ownerId }, store);
    return { ...proposal, store, lines };
  }
}
