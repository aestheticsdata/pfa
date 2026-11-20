import type { ReceiptFile } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/**
 * Reads the text printed on a receipt image (PFA-274): a driven port. Each reading lists the text
 * of its pages, left to right; which reading holds up is the parser's call. Tesseract, run on the
 * server, is today's adapter — a cloud OCR would be another, and nothing else would change.
 */
export abstract class ReceiptTextReader {
  abstract read(receipt: ReceiptFile): Promise<string[][]>;
}
