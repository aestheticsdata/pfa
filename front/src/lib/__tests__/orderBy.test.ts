import { orderBy, SORT_DIR } from "@lib/orderBy";
import { describe, expect, it } from "vitest";

interface Row {
  id: number;
  label: string;
  amount: number;
}

const rows: Row[] = [
  { id: 1, label: "b", amount: 10 },
  { id: 2, label: "a", amount: 30 },
  { id: 3, label: "b", amount: 30 },
  { id: 4, label: "c", amount: 20 },
];

const ids = (sorted: Row[]) => sorted.map((row) => row.id);

describe("orderBy", () => {
  it("sorts ascending and descending on one key", () => {
    expect(ids(orderBy(rows, [(r) => r.label], [SORT_DIR.asc]))).toEqual([2, 1, 3, 4]);
    expect(ids(orderBy(rows, [(r) => r.amount], [SORT_DIR.desc]))).toEqual([2, 3, 4, 1]);
  });

  it("breaks ties with the next key, in its own direction", () => {
    expect(ids(orderBy(rows, [(r) => r.label, (r) => r.amount], [SORT_DIR.asc, SORT_DIR.desc]))).toEqual([2, 3, 1, 4]);
  });

  it("is stable and ascending when no direction is given", () => {
    expect(ids(orderBy(rows, [(r) => r.amount], []))).toEqual([1, 4, 2, 3]);
  });

  it("leaves the input untouched", () => {
    orderBy(rows, [(r) => r.label], [SORT_DIR.desc]);
    expect(ids(rows)).toEqual([1, 2, 3, 4]);
  });
});
