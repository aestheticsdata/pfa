import { toEuros } from "@pfa/shared/money/cents";
import { formatSplitAmount } from "@pfa/shared/money/format";

import type { AmountParts } from "@lib/interfaces/amountTypes";

/** The app's locale; i18n is deliberately out of scope (FR / EUR only). */
export const LOCALE = "fr-FR";

/** Narrow no-break space: the separator fr-FR puts before "€". */
const THIN_SPACE = " ";

/**
 * Integer cents → the parts `<Amount>` draws: "1 577" + "," + "18" + " €". The sign stays on the
 * units; `signed` adds "+" to a positive amount.
 */
export const splitAmount = (cents: number, signed = false): AmountParts => {
  const { int, dec, separator } = formatSplitAmount(toEuros(cents), LOCALE);
  return {
    units: signed && cents > 0 ? `+${int}` : int,
    separator,
    decimals: dec,
    currency: `${THIN_SPACE}€`,
  };
};

/** What a screen reader says: "1 577,18 euros", "moins 12,50 euros". */
export const describeAmount = (cents: number) => {
  const { int, dec, separator } = formatSplitAmount(toEuros(Math.abs(cents)), LOCALE);
  const figure = dec === "00" ? int : `${int}${separator}${dec}`;
  return `${cents < 0 ? "moins " : ""}${figure} euros`;
};
