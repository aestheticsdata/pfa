import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { LinkedLine } from "@spendings/product-types/interfaces/productTypesTypes";
import { linkProductTypes, storeKey } from "@spendings/product-types/product-links";
import { ProductTypesService } from "@spendings/product-types/product-types.service";
import type {
  ReceiptLine,
  ReceiptProposal,
  SavedReceipt,
  SizeUnit,
} from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
import { ReceiptOcrService } from "@spendings/receipt-lines/receipt-ocr.service";
import { parseReceiptPages, pickProposal } from "@spendings/receipt-lines/receipt-text-parser";
import { SIZE_UNIT } from "@spendings/receipt-lines/size-units";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import type { StoreIdentity } from "@spendings/stores/interfaces/storesTypes";
import { StoresService } from "@spendings/stores/stores.service";
import { textKey } from "@spendings/text-key";
import { PrismaService } from "../../prisma/prisma.service";

// How far back the auto-link learns from: plenty for a household's receipts.
const LINK_HISTORY = 2000;

const SIZE_UNITS = new Set<string>(Object.values(SIZE_UNIT));
const isSizeUnit = (unit: string | null): unit is SizeUnit => unit !== null && SIZE_UNITS.has(unit);

/**
 * The line items and store of a spending's receipt (PFA-214, PFA-218, PFA-219):
 * proposed by the local OCR, saved only once the user accepted them.
 */
@Injectable()
export class ReceiptLinesService {
  // biome-ignore lint/complexity/useMaxParams: Nest injects each dependency as its own constructor parameter.
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptFiles: ReceiptFilesService,
    private readonly ocr: ReceiptOcrService,
    private readonly stores: StoresService,
    private readonly productTypes: ProductTypesService,
  ) {}

  private async ownedSpending(spendingID: string, userID: string) {
    const spending = await this.prisma.spendings.findFirst({
      where: { ID: spendingID, userID },
      select: { invoicefile: true, store: { select: { name: true, address: true } } },
    });
    if (!spending) {
      throw new NotFoundException("Spending not found");
    }
    return spending;
  }

  async read(spendingID: string, userID: string): Promise<SavedReceipt> {
    const { store } = await this.ownedSpending(spendingID, userID);
    const rows = await this.prisma.receiptLines.findMany({
      where: { spendingID },
      orderBy: { position: "asc" },
      select: {
        label: true,
        amount: true,
        quantity: true,
        size: true,
        sizeUnit: true,
        productType: { select: { name: true } },
      },
    });
    return {
      lines: rows.map((row) => ({
        label: row.label,
        amount: Number(row.amount),
        quantity: Number(row.quantity),
        size: row.size === null ? null : Number(row.size),
        sizeUnit: isSizeUnit(row.sizeUnit) ? row.sizeUnit : null,
        productType: row.productType?.name ?? null,
      })),
      store,
    };
  }

  async save(spendingID: string, userID: string, receipt: SavedReceipt): Promise<SavedReceipt> {
    await this.ownedSpending(spendingID, userID);
    const typeIDs = await this.productTypes.resolve(
      receipt.lines.flatMap((line) => (line.productType ? [line.productType] : [])),
      userID,
    );
    const storeWrite =
      receipt.store === undefined
        ? []
        : [
            this.prisma.spendings.updateMany({
              where: { ID: spendingID, userID },
              data: { storeID: receipt.store ? await this.stores.resolve(receipt.store, userID) : null },
            }),
          ];
    await this.prisma.$transaction([
      // Saved lines settle a bulk-read proposal (PFA-223).
      this.prisma.receiptProposals.deleteMany({ where: { spendingID } }),
      this.prisma.receiptLines.deleteMany({ where: { spendingID } }),
      this.prisma.receiptLines.createMany({
        data: receipt.lines.map((line, position) => ({
          ID: randomUUID(),
          spendingID,
          position,
          label: line.label.trim(),
          amount: line.amount,
          quantity: line.quantity,
          size: line.size,
          sizeUnit: line.size === null ? null : line.sizeUnit,
          productTypeID: line.productType ? (typeIDs.get(textKey(line.productType)) ?? null) : null,
        })),
      }),
      ...storeWrite,
    ]);
    return this.read(spendingID, userID);
  }

  /** Reads the spending's receipt; nothing is stored until the user saves. */
  async propose(spendingID: string, userID: string): Promise<ReceiptProposal> {
    const { invoicefile } = await this.ownedSpending(spendingID, userID);
    if (!invoicefile) {
      throw new BadRequestException("NO_RECEIPT");
    }
    const readings = await this.ocr.read(this.receiptFiles.safePath(userID, invoicefile));
    const proposal = pickProposal(readings.map(parseReceiptPages));
    // A store read slightly off comes back as the user's known shop.
    const store = await this.stores.recognise(proposal.store, userID);
    return { ...proposal, store, lines: await this.linkTypes(proposal.lines, store, userID) };
  }

  /** The proposed lines with the product types their labels were given before (PFA-219). */
  private async linkTypes(lines: ReceiptLine[], store: StoreIdentity | null, userID: string): Promise<ReceiptLine[]> {
    if (lines.length === 0) return lines;
    const rows = await this.prisma.receiptLines.findMany({
      where: { productTypeID: { not: null }, spending: { userID } },
      orderBy: [{ spending: { date: "desc" } }, { position: "asc" }],
      take: LINK_HISTORY,
      select: {
        label: true,
        productType: { select: { name: true } },
        spending: { select: { store: { select: { name: true, address: true } } } },
      },
    });
    const history: LinkedLine[] = rows.flatMap((row) =>
      row.productType
        ? [
            {
              label: row.label,
              productType: row.productType.name,
              storeKey: row.spending.store ? storeKey(row.spending.store) : null,
            },
          ]
        : [],
    );
    return linkProductTypes(lines, history, store);
  }
}
