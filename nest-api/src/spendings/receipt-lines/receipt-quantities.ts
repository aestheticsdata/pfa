import type { ItemSize, QuantityDetail, SizeUnit } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
import { SIZE_UNIT } from "@spendings/receipt-lines/size-units";

/**
 * Quantities and sizes on a receipt (PFA-219): what a unit price needs. Pure
 * reading of label and column text; the user checks every value before saving.
 */

const UNITS: Record<string, SizeUnit> = {
  G: SIZE_UNIT.g,
  GR: SIZE_UNIT.g,
  KG: SIZE_UNIT.kg,
  ML: SIZE_UNIT.ml,
  CL: SIZE_UNIT.cl,
  L: SIZE_UNIT.l,
};
const UNIT = "(KG|GR|G|ML|CL|L)";
const NUMBER = "(\\d+(?:[.,]\\d+)?)";
// "6X1L": six of one litre. "500ML", "1,5 L", "250G".
const PACK_SIZE = new RegExp(`(?<![\\w.,])(\\d{1,2})\\s?X\\s?${NUMBER}\\s?${UNIT}(?![A-Z])`, "i");
const SIZE = new RegExp(`(?<![\\w.,])${NUMBER}\\s?${UNIT}(?![A-Z])`, "i");
// "3 x 1,10", "2 * 0,99", "0,512 kg x 3,99 €/kg".
const DETAIL = new RegExp(`^${NUMBER}\\s*(KG)?\\s*[xX*]\\s*(\\d{1,4}[.,]\\d{2})`, "i");
// "1 BANANE SECHEE": a count before the label.
const LEADING_COUNT = /^(\d{1,2})\s+(?=\p{L})/u;
// The columns left between a label and its total: "4  5,99".
const COLUMNS = /(\s+\d+(?:[.,]\d+)?)+$/;

const MAX_QUANTITY = 999;
// A count times a unit price may round to the total either way by a cent.
const CENT = 0.011;

const toNumber = (text: string) => Number(text.replace(",", "."));

/** The size printed in a label — a pack counts as its whole content — or null. */
export function readSize(label: string): ItemSize | null {
  const pack = PACK_SIZE.exec(label);
  if (pack) {
    return {
      size: Math.round(toNumber(pack[1]) * toNumber(pack[2]) * 1000) / 1000,
      unit: UNITS[pack[3].toUpperCase()],
    };
  }
  const single = SIZE.exec(label);
  return single ? { size: toNumber(single[1]), unit: UNITS[single[2].toUpperCase()] } : null;
}

/**
 * The count and unit-price columns at the end of a label, read against the
 * line's total: "NAT KARITE 1L  4  5,99" priced 23,96 is four at 5,99. The
 * columns leave the label either way; the count stays 1 when they don't add up.
 */
export function splitColumns(rest: string, amount: number): { label: string; quantity: number } {
  const match = COLUMNS.exec(rest);
  if (!match) return { label: rest, quantity: 1 };
  const label = rest.slice(0, match.index);
  const numbers = match[0].trim().split(/\s+/).map(toNumber);
  const [count, unitPrice] = numbers.slice(-2);
  const fits =
    numbers.length >= 2 &&
    Number.isInteger(count) &&
    count > 0 &&
    count <= MAX_QUANTITY &&
    Math.abs(count * unitPrice - amount) <= CENT;
  return { label, quantity: fits ? count : 1 };
}

/** A count written before the label ("1 BANANE SECHEE"), taken off it. */
export function splitLeadingCount(label: string): { label: string; quantity: number } {
  const match = LEADING_COUNT.exec(label);
  const count = match ? Number(match[1]) : 0;
  return count > 0 ? { label: label.slice(match?.[0].length), quantity: count } : { label, quantity: 1 };
}

/** What a quantity or weight line says, or null when it is not one. */
export function readQuantityDetail(line: string): QuantityDetail | null {
  const match = DETAIL.exec(line.trim());
  if (!match) return null;
  const value = toNumber(match[1]);
  const unitPrice = toNumber(match[3]);
  if (match[2]) return { quantity: 1, unitPrice, weight: { size: value, unit: SIZE_UNIT.kg } };
  return Number.isInteger(value) && value > 0 && value <= MAX_QUANTITY
    ? { quantity: value, unitPrice, weight: null }
    : null;
}
