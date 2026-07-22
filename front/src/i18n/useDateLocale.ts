"use client";

import { useLocale } from "@i18n/LocaleContext";
import enUS from "date-fns/locale/en-US";
import fr from "date-fns/locale/fr";

import type { LangKeys } from "@src/interfaces/locales";
import type { Locale } from "date-fns";

/** date-fns locale per app locale — for non-hook code taking a locale param. */
export const DATE_FNS_LOCALES: Record<LangKeys, Locale> = {
  fr,
  en: enUS,
};

/** Active date-fns locale, for `format(date, pattern, { locale })` calls. */
const useDateLocale = (): Locale => {
  const { locale } = useLocale();
  return DATE_FNS_LOCALES[locale];
};

export default useDateLocale;
