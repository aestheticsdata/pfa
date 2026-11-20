import { InvalidInputError } from "@shared-kernel/domain-error";

const CENTS_PER_UNIT = 100;
const DECIMAL_AMOUNT = /^-?\d+(\.\d{1,2})?$/;

export class CurrencyMismatch extends InvalidInputError {
  constructor() {
    super("Amounts in different currencies");
  }
}

/**
 * An amount of money (PFA-272): whole cents and a currency, so sums are exact and two currencies
 * can never be added by accident. Amounts are Decimal(10,2) in MySQL; they enter as a number or a
 * decimal string and leave as a decimal string, which Prisma stores without a float on the way.
 */
export class Money {
  private constructor(
    readonly cents: number,
    readonly currency: string,
  ) {}

  /** From a number (a DTO) or a decimal string (a Prisma `Decimal`'s `toString()`). */
  static of(amount: number | string, currency: string): Money {
    const text = typeof amount === "number" ? amount.toFixed(2) : amount.trim();
    if (!DECIMAL_AMOUNT.test(text)) {
      throw new InvalidInputError(`Invalid amount: ${amount}`);
    }
    return new Money(Math.round(Number(text) * CENTS_PER_UNIT), currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  /** Adds amounts of one currency; an empty list is zero of `currency`. */
  static sum(amounts: Money[], currency: string): Money {
    return amounts.reduce((total, amount) => total.add(amount), Money.zero(currency));
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new CurrencyMismatch();
    }
    return new Money(this.cents + other.cents, this.currency);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  /** "12.30": what a Decimal column takes. */
  toDecimalString(): string {
    const sign = this.cents < 0 ? "-" : "";
    const abs = Math.abs(this.cents);
    const units = Math.floor(abs / CENTS_PER_UNIT);
    const cents = String(abs % CENTS_PER_UNIT).padStart(2, "0");
    return `${sign}${units}.${cents}`;
  }

  toNumber(): number {
    return this.cents / CENTS_PER_UNIT;
  }
}
