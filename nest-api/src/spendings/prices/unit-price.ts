import { PRICE_BASIS } from "@spendings/prices/price-basis";
import { SIZE_UNIT } from "@spendings/receipt-lines/size-units";
import type {
  BasisComparison,
  PriceBasis,
  Purchase,
  StorePrice,
  UnitPrice,
} from "@spendings/prices/interfaces/pricesTypes";
import type { SizeUnit } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";

/** Each size unit as a share of its basis: 250 g is 0.25 kg, 33 cl 0.33 L (PFA-220). */
const IN_BASIS: Record<SizeUnit, { basis: PriceBasis; factor: number }> = {
  [SIZE_UNIT.g]: { basis: PRICE_BASIS.kg, factor: 0.001 },
  [SIZE_UNIT.kg]: { basis: PRICE_BASIS.kg, factor: 1 },
  [SIZE_UNIT.ml]: { basis: PRICE_BASIS.l, factor: 0.001 },
  [SIZE_UNIT.cl]: { basis: PRICE_BASIS.l, factor: 0.01 },
  [SIZE_UNIT.l]: { basis: PRICE_BASIS.l, factor: 1 },
};
const BASIS_ORDER: PriceBasis[] = [PRICE_BASIS.kg, PRICE_BASIS.l, PRICE_BASIS.piece];

const cents = (value: number) => Math.round(value * 100) / 100;

/** What a line costs per kilo or litre when its size is known, else per piece. */
export function unitPrice(purchase: Purchase): UnitPrice {
  const quantity = purchase.quantity > 0 ? purchase.quantity : 1;
  if (purchase.size && purchase.sizeUnit) {
    const { basis, factor } = IN_BASIS[purchase.sizeUnit];
    return { price: cents(purchase.amount / (quantity * purchase.size * factor)), basis };
  }
  return { price: cents(purchase.amount / quantity), basis: PRICE_BASIS.piece };
}

function storePrice(purchases: Purchase[], prices: number[]): StorePrice {
  const last = purchases.at(-1) as Purchase;
  return {
    storeID: last.storeID,
    name: last.storeName,
    address: last.storeAddress,
    lastUnitPrice: prices.at(-1) as number,
    averageUnitPrice: cents(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    lastAmount: last.amount,
    lastQuantity: last.quantity,
    lastSize: last.size,
    lastSizeUnit: last.sizeUnit,
    lastDate: last.date,
    purchases: purchases.length,
    cheapest: false,
    history: purchases.map((purchase, i) => ({
      date: purchase.date,
      unitPrice: prices[i],
      amount: purchase.amount,
      quantity: purchase.quantity,
      size: purchase.size,
      sizeUnit: purchase.sizeUnit,
    })),
  };
}

/**
 * Per basis, each store's last and average unit price, cheapest last price
 * first and flagged (PFA-220). A per-kilo price and a per-piece one are never
 * compared: each basis is its own ranking.
 */
export function compareStores(purchases: Purchase[]): BasisComparison[] {
  const byBasis = new Map<PriceBasis, Map<string, { purchases: Purchase[]; prices: number[] }>>();
  const ordered = [...purchases].sort((a, b) => a.date.localeCompare(b.date));
  for (const purchase of ordered) {
    const { price, basis } = unitPrice(purchase);
    const stores = byBasis.get(basis) ?? new Map<string, { purchases: Purchase[]; prices: number[] }>();
    const store = stores.get(purchase.storeID) ?? { purchases: [], prices: [] };
    store.purchases.push(purchase);
    store.prices.push(price);
    stores.set(purchase.storeID, store);
    byBasis.set(basis, stores);
  }

  return BASIS_ORDER.flatMap((basis) => {
    const stores = byBasis.get(basis);
    if (!stores) return [];
    const ranked = [...stores.values()]
      .map((store) => storePrice(store.purchases, store.prices))
      .sort((a, b) => a.lastUnitPrice - b.lastUnitPrice || a.name.localeCompare(b.name));
    // Cheapest only means something next to another store.
    if (ranked.length > 1) ranked[0].cheapest = true;
    return [{ basis, stores: ranked }];
  });
}
