import { DAY_ENTRY_KIND } from "@components/spendings/config/constants";
import {
  buildDayEntries,
  groupEntriesByReceipt,
  splitSpendingLabel,
  stackedPillGradient,
  suggestMerge,
} from "@components/spendings/helpers/dayEntries";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

const spending = (over: Partial<SpendingItem>): SpendingItem => ({
  ID: "s",
  amount: 1,
  category: "food",
  categoryColor: "#111111",
  categoryID: "c-food",
  currency: "EUR",
  date: "2026-05-04",
  invoicefile: null,
  itemType: "spending",
  label: "Bakery",
  userID: "u",
  groupID: null,
  detail: null,
  groupLabel: null,
  ...over,
});

describe("buildDayEntries", () => {
  it("folds a group's lines into one entry placed at its first line", () => {
    const entries = buildDayEntries([
      spending({ ID: "a", label: "Bakery", amount: 2 }),
      spending({ ID: "b", groupID: "g", groupLabel: "Store", label: "Store — Food", amount: 9, invoicefile: "r.jpg" }),
      spending({ ID: "c", label: "Soda", amount: 1.5 }),
      spending({ ID: "d", groupID: "g", groupLabel: "Store", label: "Store — Soap", category: "care", amount: 3.5 }),
    ]);

    expect(entries.map((e) => e.ID)).toEqual(["a", "g", "c"]);
    const group = entries[1];
    expect(group.kind).toBe(DAY_ENTRY_KIND.group);
    if (group.kind !== DAY_ENTRY_KIND.group) return;
    expect(group.label).toBe("Store");
    expect(group.amount).toBe(12.5);
    expect(group.category).toBe("food");
    expect(group.invoicefile).toBe("r.jpg");
    expect(group.spendingIDs).toEqual(["b", "d"]);
  });
});

describe("groupEntriesByReceipt", () => {
  it("counts a group once among the entries sharing a file", () => {
    const entries = buildDayEntries([
      spending({ ID: "a", invoicefile: "r.jpg" }),
      spending({ ID: "b", groupID: "g", invoicefile: "r.jpg" }),
      spending({ ID: "c", groupID: "g", invoicefile: "r.jpg" }),
      spending({ ID: "d", invoicefile: null }),
    ]);

    expect(
      groupEntriesByReceipt(entries)
        .get("r.jpg")
        ?.map((e) => e.ID),
    ).toEqual(["a", "g"]);
  });
});

describe("splitSpendingLabel", () => {
  it.each([
    ["Store — groceries", "Store", "groceries"],
    ["Store - soap", "Store", "soap"],
    ["Store – a — b", "Store", "a — b"],
    ["Bakery", null, "Bakery"],
    ["Coca-Cola", null, "Coca-Cola"],
  ])("%s", (label, head, rest) => {
    expect(splitSpendingLabel(label)).toEqual({ head, rest });
  });
});

describe("suggestMerge", () => {
  it("names the group after the common head and details each line", () => {
    const entries = buildDayEntries([
      spending({ ID: "a", label: "Store — groceries" }),
      spending({ ID: "b", label: "store — soap" }),
    ]);

    const { label, lines } = suggestMerge(entries);

    expect(label).toBe("Store");
    expect(lines.map((l) => l.detail)).toEqual(["Groceries", "Soap"]);
  });

  it("falls back to the first label and brings a selected group's lines", () => {
    const entries = buildDayEntries([
      spending({ ID: "a", label: "Bakery" }),
      spending({ ID: "b", groupID: "g", groupLabel: "Store", detail: "Soap", label: "Store — Soap" }),
    ]);

    const { label, lines } = suggestMerge(entries);

    expect(label).toBe("Store");
    expect(lines.map((l) => [l.spending.ID, l.detail])).toEqual([
      ["a", "Bakery"],
      ["b", "Soap"],
    ]);
  });
});

describe("stackedPillGradient", () => {
  it("stacks each colour proportionally to its amount", () => {
    expect(
      stackedPillGradient([
        { color: "red", amount: 3 },
        { color: "blue", amount: 1 },
      ]),
    ).toBe("linear-gradient(180deg, red 0.0% 75.0%, blue 75.0% 100.0%)");
  });
});
