import { groupSpendingsByMonth } from "@components/spendings/search/groupByMonth";

import type { SpendingItem } from "@components/spendings/types";

const makeItem = (ID: string, date: string): SpendingItem =>
  ({ ID, date, label: ID, amount: 1, itemType: "spending", userID: "u1" }) as SpendingItem;

describe("groupSpendingsByMonth", () => {
  it("returns an empty array for no items", () => {
    expect(groupSpendingsByMonth([])).toEqual([]);
  });

  it("groups consecutive items of the same month into one bucket, newest-first order preserved", () => {
    const items = [
      makeItem("a", "2026-07-12"),
      makeItem("b", "2026-07-04"),
      makeItem("c", "2026-05-28"),
      makeItem("d", "2026-02-09"),
    ];

    const groups = groupSpendingsByMonth(items);

    expect(groups.map((g) => g.key)).toEqual(["2026-07", "2026-05", "2026-02"]);
    expect(groups[0].label).toBe("Juillet 2026");
    expect(groups[0].items.map((i) => i.ID)).toEqual(["a", "b"]);
    expect(groups[1].items.map((i) => i.ID)).toEqual(["c"]);
    expect(groups[2].items.map((i) => i.ID)).toEqual(["d"]);
  });

  it("keeps a separate bucket per year even for the same month number", () => {
    const groups = groupSpendingsByMonth([makeItem("a", "2026-01-10"), makeItem("b", "2025-01-10")]);

    expect(groups.map((g) => g.key)).toEqual(["2026-01", "2025-01"]);
    expect(groups.map((g) => g.label)).toEqual(["Janvier 2026", "Janvier 2025"]);
  });
});
