/**
 * Money as integer cents (PFA-284).
 *
 * The API sends and accepts amounts as decimal euros (`Decimal(10,2)` serialised as a number or a
 * string). Adding those as floats drifts — `0.1 + 0.2` is not `0.3` — so clients convert once at
 * the edge, compute in whole cents, and only turn back into euros to send or to display.
 */

/** Decimal euros from the API → integer cents. Rounds half away from zero, like the column does. */
export const toCents = (euros: number) => Math.sign(euros) * Math.round(Math.abs(euros) * 100);

/** Integer cents → decimal euros, for a request body or a formatter. */
export const toEuros = (cents: number) => cents / 100;

/** Sum of integer cents; an empty list is 0. */
export const sumCents = (amounts: readonly number[]) => amounts.reduce((total, cents) => total + cents, 0);

/**
 * What the amount keypad has typed so far ("12,5", "0,07", "1234") → integer cents, or null when
 * it is not an amount yet. Accepts a comma or a dot, at most two decimals.
 */
export const parseTypedAmount = (typed: string): number | null => {
  const match = /^(\d+)(?:[.,](\d{0,2}))?$/.exec(typed.trim());
  if (!match) return null;
  const [, units = "0", decimals = ""] = match;
  return Number(units) * 100 + Number(decimals.padEnd(2, "0"));
};
