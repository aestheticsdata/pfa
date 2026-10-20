import { isAmountWithinLimit } from "@lib/amountExpression";
import { describe, expect, it } from "vitest";

/** The amount fields' bound is the DECIMAL(10, 2) money columns' (PFA-259). */
describe("isAmountWithinLimit", () => {
  it.each([
    ["12000", true],
    ["99999999.99", true],
    ["-99999999.99", true],
    ["50000000*2", false],
    ["100000000", false],
    ["-100000000", false],
    // Not an amount at all: the submit aborts on it, the bound has no say.
    ["12+", true],
  ])("%s → %s", (input, expected) => {
    expect(isAmountWithinLimit(input)).toBe(expected);
  });
});
