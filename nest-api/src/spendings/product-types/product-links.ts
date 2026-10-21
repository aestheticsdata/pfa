import type { LinkedLine } from "@spendings/product-types/interfaces/productTypesTypes";
import type { ReceiptLine } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
import type { StoreIdentity } from "@spendings/stores/interfaces/storesTypes";
import { textKey } from "@spendings/text-key";

/** One store's identity as one key: its name and its address (PFA-219). */
export function storeKey(store: StoreIdentity): string {
  return `${textKey(store.name)}|${textKey(store.address ?? "")}`;
}

/**
 * Each proposed line takes the product type its label was given before
 * (PFA-219): at this store first, else at any store. `history` is newest first,
 * so the latest choice wins. Lines already typed keep their type.
 */
export function linkProductTypes(
  lines: ReceiptLine[],
  history: LinkedLine[],
  store: StoreIdentity | null,
): ReceiptLine[] {
  const here = store ? storeKey(store) : null;
  const atStore = new Map<string, string>();
  const anywhere = new Map<string, string>();
  for (const line of history) {
    const key = textKey(line.label);
    if (here && line.storeKey === here && !atStore.has(key)) atStore.set(key, line.productType);
    if (!anywhere.has(key)) anywhere.set(key, line.productType);
  }
  return lines.map((line) => {
    if (line.productType) return line;
    const key = textKey(line.label);
    return { ...line, productType: atStore.get(key) ?? anywhere.get(key) ?? null };
  });
}
