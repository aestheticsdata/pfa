import { DEFAULT_LOCALE, isSupportedLocale } from "@i18n/config";

import type { LangKeys } from "@i18n/interfaces/localesTypes";

/**
 * First browser language tag that maps to a supported locale, FR otherwise
 * (FR-first app). Drives the anonymous default and the signup payload.
 */
export const pickSupportedLocale = (tags: readonly string[]): LangKeys => {
  for (const tag of tags) {
    const base = tag.toLowerCase().split("-")[0];
    if (isSupportedLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
};
