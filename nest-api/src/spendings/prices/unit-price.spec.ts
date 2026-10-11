import { compareStores, unitPrice } from "@spendings/prices/unit-price";

import type { Purchase } from "@spendings/prices/interfaces/pricesTypes";

/** PFA-220 — fair prices per kilo / litre / piece, stores ranked. Invented stores and prices. */
const purchase = (patch: Partial<Purchase>): Purchase => ({
  storeID: "s1",
  storeName: "Marché Express",
  storeAddress: "4 rue des Lilas, 00001 VILLE",
  date: "2031-01-10",
  amount: 1,
  quantity: 1,
  size: null,
  sizeUnit: null,
  ...patch,
});

describe("unitPrice", () => {
  it.each([
    [
      { amount: 3, size: 250, sizeUnit: "g" as const },
      { price: 12, basis: "kg" },
    ],
    [
      { amount: 2.04, size: 0.512, sizeUnit: "kg" as const },
      { price: 3.98, basis: "kg" },
    ],
    [
      { amount: 23.96, quantity: 4, size: 1, sizeUnit: "l" as const },
      { price: 5.99, basis: "l" },
    ],
    [
      { amount: 1.5, size: 33, sizeUnit: "cl" as const },
      { price: 4.55, basis: "l" },
    ],
    [
      { amount: 2, size: 500, sizeUnit: "ml" as const },
      { price: 4, basis: "l" },
    ],
    [
      { amount: 12.9, quantity: 3 },
      { price: 4.3, basis: "piece" },
    ],
  ])("%j → %j", (patch, expected) => {
    expect(unitPrice(purchase(patch))).toEqual(expected);
  });
});

describe("compareStores", () => {
  it("ranks stores by last unit price and flags the cheapest", () => {
    const comparison = compareStores([
      purchase({ storeID: "a", storeName: "Alpha", date: "2031-01-01", amount: 3, size: 1, sizeUnit: "l" }),
      purchase({ storeID: "a", storeName: "Alpha", date: "2031-02-01", amount: 2, size: 1, sizeUnit: "l" }),
      purchase({ storeID: "b", storeName: "Beta", date: "2031-01-15", amount: 2.5, size: 1, sizeUnit: "l" }),
    ]);

    expect(comparison).toHaveLength(1);
    expect(comparison[0].basis).toBe("l");
    expect(
      comparison[0].stores.map((s) => [s.name, s.lastUnitPrice, s.averageUnitPrice, s.purchases, s.cheapest]),
    ).toEqual([
      ["Alpha", 2, 2.5, 2, true],
      ["Beta", 2.5, 2.5, 1, false],
    ]);
    // Each point carries the purchase as paid, for the chart's tooltip (PFA-222).
    expect(comparison[0].stores[0].history).toEqual([
      { date: "2031-01-01", unitPrice: 3, amount: 3, quantity: 1, size: 1, sizeUnit: "l" },
      { date: "2031-02-01", unitPrice: 2, amount: 2, quantity: 1, size: 1, sizeUnit: "l" },
    ]);
  });

  it("never mixes a per-kilo price with a per-piece one", () => {
    const comparison = compareStores([
      purchase({ storeID: "a", amount: 3, size: 250, sizeUnit: "g" }),
      purchase({ storeID: "b", amount: 1 }),
    ]);

    expect(comparison.map((c) => [c.basis, c.stores.length])).toEqual([
      ["kg", 1],
      ["piece", 1],
    ]);
    // Alone on its basis, a store is not "the cheapest".
    expect(comparison.every((c) => !c.stores[0].cheapest)).toBe(true);
  });

  it("has nothing to compare without purchases", () => {
    expect(compareStores([])).toEqual([]);
  });
});
