import type { ReceiptLineDraft } from "@components/spendings/interfaces/receiptLinesTypes";
import type { ReceiptLine } from "@src/schemas/receiptLines";

// A plain amount, a discount being negative: "3,85", "-0.50". No sums here —
// a receipt line is one price.
const AMOUNT_SHAPE = /^-?\d{1,4}([.,]\d{1,2})?$/;
// A count or a size: "2", "0,512", "1.5" (PFA-219).
const MEASURE_SHAPE = /^\d{1,5}([.,]\d{1,3})?$/;

// Within a cent, the lines add up to the spending.
const CENT = 0.005;

const asText = (value: number) => String(value).replace(".", ",");

export const emptyLineDraft = (): ReceiptLineDraft => ({
  key: crypto.randomUUID(),
  label: "",
  amount: "",
  quantity: "1",
  size: "",
  sizeUnit: null,
  productType: null,
  linked: false,
});

/** Lines as the editor shows them; `linked` marks the types the proposal took from earlier receipts. */
export const draftsFromLines = (lines: ReceiptLine[], linked: boolean): ReceiptLineDraft[] =>
  lines.map((line) => ({
    key: crypto.randomUUID(),
    label: line.label,
    amount: line.amount.toFixed(2),
    quantity: asText(line.quantity),
    size: line.size === null ? "" : asText(line.size),
    sizeUnit: line.size === null ? null : line.sizeUnit,
    productType: line.productType,
    linked: linked && line.productType !== null,
  }));

const readNumber = (text: string, shape: RegExp): number | null => {
  const input = text.replace(/\s/g, "").replace(",", ".");
  return shape.test(input) ? Number(input) : null;
};

/** The typed amount as a number, or null when it is not one. */
export const lineAmount = (draft: ReceiptLineDraft): number | null => readNumber(draft.amount, AMOUNT_SHAPE);

/** The typed count, or null when it is not a positive one. */
const lineQuantity = (draft: ReceiptLineDraft): number | null => {
  const quantity = readNumber(draft.quantity, MEASURE_SHAPE);
  return quantity !== null && quantity > 0 ? quantity : null;
};

/** The typed size with its unit, null when sold by the piece, undefined when unreadable. */
const lineSize = (draft: ReceiptLineDraft) => {
  if (!draft.size.trim()) return null;
  const size = readNumber(draft.size, MEASURE_SHAPE);
  return size !== null && size > 0 && draft.sizeUnit ? { size, unit: draft.sizeUnit } : undefined;
};

const isValid = (draft: ReceiptLineDraft) =>
  Boolean(draft.label.trim()) &&
  lineAmount(draft) !== null &&
  lineQuantity(draft) !== null &&
  lineSize(draft) !== undefined;

/** The lines to save, or the keys of the drafts that cannot be saved as they are. */
export const toReceiptLines = (drafts: ReceiptLineDraft[]) => {
  const invalidKeys = drafts.filter((d) => !isValid(d)).map((d) => d.key);
  const lines: ReceiptLine[] = drafts.map((d) => {
    const size = lineSize(d);
    return {
      label: d.label.trim(),
      amount: lineAmount(d) ?? 0,
      quantity: lineQuantity(d) ?? 1,
      size: size?.size ?? null,
      sizeUnit: size?.unit ?? null,
      productType: d.productType?.trim() || null,
    };
  });
  return { lines, invalidKeys };
};

/** Sum of the lines, rounded to the cent. */
export const sumLines = (amounts: number[]) => Math.round(amounts.reduce((sum, a) => sum + a, 0) * 100) / 100;

export const linesMatch = (sum: number, amount: number) => Math.abs(sum - amount) < CENT;
