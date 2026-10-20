import {
  draftsFromLines,
  emptyLineDraft,
  lineAmount,
  linesMatch,
  sumLines,
  toReceiptLines,
} from "@components/spendings/receiptLines/receiptLineDrafts";
import { describe, expect, it } from "vitest";

import type { ReceiptLineDraft } from "@components/spendings/interfaces/receiptLinesTypes";

const draft = (patch: Partial<ReceiptLineDraft>) => ({ ...emptyLineDraft(), label: "PAIN", amount: "1", ...patch });

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
    expect(lineAmount(draft({ amount }))).toBe(expected);
  });
});

describe("toReceiptLines", () => {
  it("reads labels, amounts, counts, sizes and types", () => {
    const { lines, invalidKeys } = toReceiptLines([
      draft({ label: "  CAFE ", amount: "3,85", quantity: "2", size: "250", sizeUnit: "g", productType: " Café " }),
      draft({ label: "TOMATES", amount: "2,04", size: "0,512", sizeUnit: "kg" }),
      draft({ label: "REMISE", amount: "-0,50" }),
    ]);

    expect(invalidKeys).toEqual([]);
    expect(lines).toEqual([
      { label: "CAFE", amount: 3.85, quantity: 2, size: 250, sizeUnit: "g", productType: "Café" },
      { label: "TOMATES", amount: 2.04, quantity: 1, size: 0.512, sizeUnit: "kg", productType: null },
      { label: "REMISE", amount: -0.5, quantity: 1, size: null, sizeUnit: null, productType: null },
    ]);
  });

  it("flags a line missing a label, or with an unreadable amount, count or size", () => {
    const blank = draft({ label: "   " });
    const broken = draft({ amount: "1,2,3" });
    const noCount = draft({ quantity: "0" });
    const sizeWithoutUnit = draft({ size: "500" });
    const ok = draft({});

    expect(toReceiptLines([ok, blank, broken, noCount, sizeWithoutUnit]).invalidKeys).toEqual([
      blank.key,
      broken.key,
      noCount.key,
      sizeWithoutUnit.key,
    ]);
  });
});

describe("draftsFromLines", () => {
  const line = { label: "LAIT", amount: 1.1, quantity: 0.5, size: 1.5, sizeUnit: "l" as const, productType: "Lait" };

  it("shows numbers as typed text", () => {
    const [shown] = draftsFromLines([line], false);
    expect([shown.amount, shown.quantity, shown.size, shown.sizeUnit]).toEqual(["1.10", "0,5", "1,5", "l"]);
  });

  it("marks types taken from earlier receipts, only when asked and present", () => {
    expect(draftsFromLines([line], true)[0].linked).toBe(true);
    expect(draftsFromLines([line], false)[0].linked).toBe(false);
    expect(draftsFromLines([{ ...line, productType: null }], true)[0].linked).toBe(false);
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
