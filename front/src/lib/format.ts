// Shared number formatting. Single home for the currency/amount helpers that
// used to be re-declared across ~9 files — and the one place to touch if the
// app ever goes multi-currency / multi-locale again (that was dropped early on;
// FR / EUR only for now). Naming: `euro` = 2 decimals, `euro0` = 0 decimals.

/** Amount with exactly two decimals, e.g. 1234.5 → "1 234,50". */
export const euro = (n: number) =>
  Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Amount rounded to the nearest integer, e.g. 1234.5 → "1 235". */
export const euro0 = (n: number) => Math.round(Number(n)).toLocaleString("fr-FR");

/** One-decimal percentage with a French comma, e.g. 12.34 → "12,3". */
export const pct1 = (n: number) => n.toFixed(1).replace(".", ",");

/** Split a formatted amount into its integer and decimal parts for the
 *  "{int} + de-emphasised ,decimals €" rendering (see MoneyAmount). */
export const splitAmount = (n: number): { int: string; dec: string } => {
  const [int, dec = "00"] = euro(n).split(",");
  return { int, dec };
};
