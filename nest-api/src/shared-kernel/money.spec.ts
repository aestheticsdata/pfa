import { CurrencyMismatch, Money } from "@shared-kernel/money";

describe("Money", () => {
  it("adds in cents, without float drift", () => {
    const total = Money.sum([Money.of(0.1, "EUR"), Money.of(0.2, "EUR")], "EUR");
    expect(total.toDecimalString()).toBe("0.30");
    expect(total.toNumber()).toBe(0.3);
  });

  it("reads a Decimal column's text as it is", () => {
    expect(Money.of("12.3", "EUR").cents).toBe(1230);
    expect(Money.of("-4.05", "EUR").toDecimalString()).toBe("-4.05");
  });

  it("rounds the third decimal half away from zero, as a DECIMAL(10,2) column does", () => {
    expect(Money.of(1.005, "EUR").toDecimalString()).toBe("1.01");
    expect(Money.of("-2.344", "EUR").toDecimalString()).toBe("-2.34");
    expect(Money.of(12.5, "EUR").toDecimalString()).toBe("12.50");
  });

  it("refuses what is not a decimal", () => {
    expect(() => Money.of("12,30", "EUR")).toThrow("Invalid amount: 12,30");
    expect(() => Money.of(Number.NaN, "EUR")).toThrow("Invalid amount: NaN");
  });

  it("never adds two currencies", () => {
    expect(() => Money.of(1, "EUR").add(Money.of(1, "USD"))).toThrow(CurrencyMismatch);
  });

  it("is zero of the given currency when there is nothing to add", () => {
    expect(Money.sum([], "EUR").equals(Money.zero("EUR"))).toBe(true);
  });
});
