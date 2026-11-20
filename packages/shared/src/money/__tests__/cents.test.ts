import { describe, expect, it } from "vitest";
import { parseTypedAmount, sumCents, toCents, toEuros } from "#money/cents";
import { formatSplitAmount } from "#money/format";

describe("toCents / toEuros", () => {
  it("converts the API's decimal euros into exact integer cents", () => {
    expect(toCents(1577.18)).toBe(157718);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(-12.345)).toBe(-1235);
    expect(toEuros(157718)).toBe(1577.18);
  });

  it("adds in cents without float drift", () => {
    const amounts = [0.1, 0.2, 0.3].map(toCents);
    expect(sumCents(amounts)).toBe(60);
    expect(sumCents([])).toBe(0);
  });
});

describe("parseTypedAmount", () => {
  it.each([
    ["12", 1200],
    ["12,5", 1250],
    ["12.50", 1250],
    ["0,07", 7],
    ["1234,", 123400],
  ])("%s → %i cents", (typed, cents) => {
    expect(parseTypedAmount(typed)).toBe(cents);
  });

  it.each(["", ",5", "12,345", "1 234", "abc", "-3"])("refuses %j", (typed) => {
    expect(parseTypedAmount(typed)).toBeNull();
  });
});

describe("formatSplitAmount", () => {
  it("splits a fr-FR amount into the integer part and the de-emphasised decimals", () => {
    const { int, dec, separator } = formatSplitAmount(1577.18, "fr-FR");
    expect(int.replace(/\s/g, " ")).toBe("1 577");
    expect(dec).toBe("18");
    expect(separator).toBe(",");
  });
});
