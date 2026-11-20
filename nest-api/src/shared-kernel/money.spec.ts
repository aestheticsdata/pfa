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

  it("refuses an amount it would have to round", () => {
    expect(() => Money.of("1.234", "EUR")).toThrow("Invalid amount: 1.234");
  });

  it("never adds two currencies", () => {
    expect(() => Money.of(1, "EUR").add(Money.of(1, "USD"))).toThrow(CurrencyMismatch);
  });

  it("is zero of the given currency when there is nothing to add", () => {
    expect(Money.sum([], "EUR").equals(Money.zero("EUR"))).toBe(true);
  });
});
