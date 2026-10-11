import { round2, roundCurrency } from "@stats/helpers/rounding.helper";

describe("roundCurrency", () => {
  it("rounds to the whole unit", () => {
    expect(roundCurrency(2.4)).toBe(2);
    expect(roundCurrency(2.5)).toBe(3);
  });
});

describe("round2", () => {
  it("rounds to the cent, killing float noise", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(12.345)).toBe(12.35);
  });
});
