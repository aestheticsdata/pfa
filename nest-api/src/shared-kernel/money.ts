import { InvalidInputError } from "@shared-kernel/domain-error";

const CENTS_PER_UNIT = 100;
const DECIMAL_AMOUNT = /^(-?)(\d+)(?:\.(\d+))?$/;
const HALF = 5;

/** A decimal's text in whole cents, the third decimal rounded half away from zero like DECIMAL(10,2). */
function toCents(text: string): number | null {
  const match = DECIMAL_AMOUNT.exec(text);
  if (!match) return null;
  const [, sign, units, fraction = ""] = match;
  const digits = fraction.padEnd(3, "0");
  const cents = Number(units) * CENTS_PER_UNIT + Number(digits.slice(0, 2)) + (Number(digits[2]) >= HALF ? 1 : 0);
  return sign && cents !== 0 ? -cents : cents;
}

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

  /**
   * From a number (a DTO) or a decimal string (a Prisma `Decimal`'s `toString()`). A number is read
   * from its shortest text, never multiplied as a float: 1.005 is 1.01, as MySQL would store it.
   */
  static of(amount: number | string, currency: string): Money {
    const cents = toCents(String(amount).trim());
    if (cents === null) {
      throw new InvalidInputError(`Invalid amount: ${amount}`);
    }
    return new Money(cents, currency);
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
