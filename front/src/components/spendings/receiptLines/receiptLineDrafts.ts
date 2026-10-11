import type { ReceiptLineDraft } from "@components/spendings/interfaces/receiptLinesTypes";
import type { ReceiptLine } from "@src/schemas/receiptLines";

// A plain amount, a discount being negative: "3,85", "-0.50". No sums here —
// a receipt line is one price.
const AMOUNT_SHAPE = /^-?\d{1,4}([.,]\d{1,2})?$/;

// Within a cent, the lines add up to the spending.
const CENT = 0.005;

export const emptyLineDraft = (): ReceiptLineDraft => ({ key: crypto.randomUUID(), label: "", amount: "" });

export const draftsFromLines = (lines: ReceiptLine[]): ReceiptLineDraft[] =>
  lines.map((line) => ({ key: crypto.randomUUID(), label: line.label, amount: line.amount.toFixed(2) }));

/** The typed amount as a number, or null when it is not one. */
export const lineAmount = (draft: ReceiptLineDraft): number | null => {
  const input = draft.amount.replace(/\s/g, "").replace(",", ".");
  return AMOUNT_SHAPE.test(input) ? Number(input) : null;
};

/** The lines to save, or the keys of the drafts that cannot be saved as they are. */
export const toReceiptLines = (drafts: ReceiptLineDraft[]) => {
  const invalidKeys = drafts.filter((d) => !d.label.trim() || lineAmount(d) === null).map((d) => d.key);
  const lines = drafts.map((d) => ({ label: d.label.trim(), amount: lineAmount(d) ?? 0 }));
  return { lines, invalidKeys };
};

/** Sum of the lines, rounded to the cent. */
export const sumLines = (amounts: number[]) => Math.round(amounts.reduce((sum, a) => sum + a, 0) * 100) / 100;

export const linesMatch = (sum: number, amount: number) => Math.abs(sum - amount) < CENT;
