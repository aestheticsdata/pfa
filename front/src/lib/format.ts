// Shared number formatting. Single home for the currency/amount helpers that
// used to be re-declared across ~9 files. Locale-explicit since COS-155.
//
// Components must NOT import these directly — they get locale-bound versions
// from `useFormat()` (@i18n/useFormat), which re-renders them on a language
// switch. These raw functions are for non-React code and tests.
// Currency stays EUR. Naming: `euro` = 2 decimals, `euro0` = 0 decimals.

const TWO_DECIMALS = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** Amount with exactly two decimals, e.g. 1234.5 → "1 234,50" / "1,234.50". */
export const formatEuro = (n: number, locale: string) => Number(n).toLocaleString(locale, TWO_DECIMALS);

/** Amount rounded to the nearest integer, e.g. 1234.5 → "1 235" / "1,235". */
export const formatEuro0 = (n: number, locale: string) => Math.round(Number(n)).toLocaleString(locale);

/** One-decimal percentage in the active locale, e.g. 12.34 → "12,3" / "12.3". */
export const formatPct1 = (n: number, locale: string) =>
  Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Split a formatted amount for the "{int} + de-emphasised {sep}{decimals} €"
 * rendering (see MoneyAmount). `separator` is part of the result because it is
 * locale-dependent ("," in fr-FR, "." in en-US) and callers render it.
 */
export const formatSplitAmount = (
  n: number,
  locale: string,
): { int: string; dec: string; separator: string } => {
  const parts = new Intl.NumberFormat(locale, TWO_DECIMALS).formatToParts(Number(n));
  const decimalIndex = parts.findIndex((part) => part.type === "decimal");
  return {
    // Everything before the decimal point — keeps the minus sign and grouping.
    int: parts
      .slice(0, decimalIndex)
      .map((part) => part.value)
      .join(""),
    dec: parts.find((part) => part.type === "fraction")?.value ?? "00",
    separator: parts[decimalIndex]?.value ?? ",",
  };
};
