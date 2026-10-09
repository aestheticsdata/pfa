import {
  draftAmount,
  emptyDraft,
  isAmountExpression,
  summarizeDrafts,
  toLinePayloads,
} from "@components/spendings/common/spendingModal/group/groupLineDrafts";

const food = { ID: "c1", userID: "u", name: "Food", color: "#111111" };
const care = { ID: "c2", userID: "u", name: "Care", color: "#222222" };

describe("draftAmount", () => {
  it.each([
    ["12", 12],
    ["12+3.5+7.5", 23],
    ["12+3,5+7,5", 23],
    ["2,5*2", 5],
    ["3,79", 3.79],
    ["12+", null],
    ["", null],
    ["0", null],
    ["-4", null],
    ["abc", null],
  ])("%s → %s", (amount, expected) => {
    expect(draftAmount({ ...emptyDraft(), amount })).toBe(expected);
  });
});

describe("toLinePayloads", () => {
  it("evaluates every line and reports the invalid ones", () => {
    const ok = { ...emptyDraft(food, "9+1"), detail: "groceries" };
    const bad = emptyDraft(care, "");

    const { lines, invalidKeys } = toLinePayloads([ok, bad]);

    expect(lines[0]).toEqual({ detail: "groceries", amount: 10, category: food });
    expect(invalidKeys).toEqual([bad.key]);
  });

  it("keeps an existing line's ID", () => {
    const { lines } = toLinePayloads([{ ...emptyDraft(food, "2"), ID: "s1" }]);
    expect(lines[0].ID).toBe("s1");
  });
});

describe("summarizeDrafts", () => {
  it("counts lines, distinct categories and the total", () => {
    expect(summarizeDrafts([emptyDraft(food, "9"), emptyDraft(care, "3.5"), emptyDraft(food, "")])).toEqual({
      lines: 3,
      categories: 2,
      total: 12.5,
    });
  });
});

describe("isAmountExpression", () => {
  it.each([
    ["12+3,5", true],
    ["2,5*2", true],
    ["3,79", false],
    ["-4", false],
  ])("%s → %s", (amount, expected) => {
    expect(isAmountExpression(amount)).toBe(expected);
  });
});
