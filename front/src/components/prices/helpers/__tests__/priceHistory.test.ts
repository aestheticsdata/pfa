import {
  hasHistory,
  historyPoints,
  nearestPoint,
  priceDomain,
  SERIES_COLORS,
  storeColors,
} from "@components/prices/helpers/priceHistory";
import { describe, expect, it } from "vitest";

import type { BasisComparison, StorePrice } from "@src/schemas/prices";

const point = (date: string, unitPrice: number) => ({
  date,
  unitPrice,
  amount: unitPrice,
  quantity: 1,
  size: 1,
  sizeUnit: "l" as const,
});

const store = (storeID: string, name: string, history = [point("2031-01-01", 2)]): StorePrice => ({
  storeID,
  name,
  address: null,
  lastUnitPrice: 2,
  averageUnitPrice: 2,
  lastAmount: 2,
  lastQuantity: 1,
  lastSize: 1,
  lastSizeUnit: "l",
  lastDate: "2031-01-01",
  purchases: history.length,
  cheapest: false,
  history,
});

const basis = (stores: StorePrice[]): BasisComparison => ({ basis: "l", stores });

describe("storeColors", () => {
  it("colours stores by name, the same on every basis whatever their rank", () => {
    const colors = storeColors([basis([store("b", "Beta"), store("a", "Alpha")]), basis([store("a", "Alpha")])]);
    expect(colors.get("a")).toBe(SERIES_COLORS[0]);
    expect(colors.get("b")).toBe(SERIES_COLORS[1]);
  });

  it("never cycles: stores past the last hue get none", () => {
    const stores = ["A", "B", "C", "D", "E", "F"].map((name) => store(name, name));
    const colors = storeColors([basis(stores)]);
    expect(colors.size).toBe(SERIES_COLORS.length);
    expect(colors.has("F")).toBe(false);
  });
});

describe("hasHistory / historyPoints", () => {
  it("needs a store bought more than once", () => {
    expect(hasHistory(basis([store("a", "Alpha"), store("b", "Beta")]))).toBe(false);
    expect(hasHistory(basis([store("a", "Alpha", [point("2031-01-01", 2), point("2031-01-03", 3)])]))).toBe(true);
  });

  it("turns each coloured store's purchases into points, by day", () => {
    const comparison = basis([store("a", "Alpha", [point("2031-01-01", 2), point("2031-01-03", 3)])]);
    const points = historyPoints(comparison, new Map([["a", "var(--series-1)"]]));
    expect(points.map((p) => [p.storeName, p.unitPrice, p.color])).toEqual([
      ["Alpha", 2, "var(--series-1)"],
      ["Alpha", 3, "var(--series-1)"],
    ]);
    expect(points[1].day - points[0].day).toBe(2);
    expect(historyPoints(comparison, new Map())).toEqual([]);
  });
});

describe("priceDomain", () => {
  it("pads the range, and gives a flat price some span", () => {
    expect(priceDomain([2, 3])).toEqual([1.88, 3.12]);
    expect(priceDomain([4, 4])).toEqual([3.5, 4.5]);
    expect(priceDomain([0.1, 0.1])[0]).toBe(0);
  });
});

describe("nearestPoint", () => {
  it("finds the closest point within reach, else null", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(nearestPoint(points, { x: 8, y: 1 }, 5)).toBe(1);
    expect(nearestPoint(points, { x: 50, y: 50 }, 5)).toBeNull();
  });
});
