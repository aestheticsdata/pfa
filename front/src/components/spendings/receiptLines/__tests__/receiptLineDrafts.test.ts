import {
  draftsFromLines,
  emptyLineDraft,
  lineAmount,
  linesMatch,
  sumLines,
  toReceiptLines,
} from "@components/spendings/receiptLines/receiptLineDrafts";

const draft = (label: string, amount: string) => ({ ...emptyLineDraft(), label, amount });

describe("lineAmount", () => {
  it.each([
    ["3,85", 3.85],
    ["3.85", 3.85],
    ["-0,50", -0.5],
    [" 12 ", 12],
    ["1 2,5", 12.5],
    ["", null],
    ["12+3", null],
    ["abc", null],
    ["3,855", null],
    ["12345", null],
  ])("%s → %s", (amount, expected) => {
    expect(lineAmount(draft("PAIN", amount))).toBe(expected);
  });
});

describe("toReceiptLines", () => {
  it("trims labels and reads amounts", () => {
    expect(toReceiptLines([draft("  CAFE ", "3,85"), draft("REMISE", "-0,50")])).toEqual({
      lines: [
        { label: "CAFE", amount: 3.85 },
        { label: "REMISE", amount: -0.5 },
      ],
      invalidKeys: [],
    });
  });

  it("flags a line without a label or with an unreadable amount", () => {
    const blank = draft("   ", "1,00");
    const broken = draft("THE", "1,2,3");
    expect(toReceiptLines([draft("PAIN", "1"), blank, broken]).invalidKeys).toEqual([blank.key, broken.key]);
  });
});

describe("draftsFromLines", () => {
  it("shows amounts with two decimals", () => {
    expect(draftsFromLines([{ label: "LAIT", amount: 1.1 }]).map(({ label, amount }) => [label, amount])).toEqual([
      ["LAIT", "1.10"],
    ]);
  });
});

describe("sumLines / linesMatch", () => {
  it("adds up to the cent without float noise", () => {
    expect(sumLines([0.1, 0.2, 1.15])).toBe(1.45);
  });

  it("matches the spending within a cent", () => {
    expect(linesMatch(sumLines([2.3, 1.15, 3, 4.27]), 10.72)).toBe(true);
    expect(linesMatch(10.71, 10.72)).toBe(false);
  });
});
