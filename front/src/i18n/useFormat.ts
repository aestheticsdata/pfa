"use client";

import { NUMBER_LOCALES } from "@i18n/config";
import { useLocale } from "@i18n/LocaleContext";
import { formatEuro, formatEuro0, formatPct1, formatSplitAmount } from "@lib/format";

/**
 * Number formatters bound to the active locale. Subscribing to the locale
 * context is what re-renders a component on a language switch — importing the
 * raw helpers from "@lib/format" instead would leave stale numbers on screen.
 */
const useFormat = () => {
  const { locale } = useLocale();
  const numberLocale = NUMBER_LOCALES[locale];

  return {
    numberLocale,
    euro: (n: number) => formatEuro(n, numberLocale),
    euro0: (n: number) => formatEuro0(n, numberLocale),
    pct1: (n: number) => formatPct1(n, numberLocale),
    splitAmount: (n: number) => formatSplitAmount(n, numberLocale),
  };
};

export default useFormat;
