import type { LangKeys } from "@i18n/interfaces/localesTypes";

export const SUPPORTED_LOCALES: readonly LangKeys[] = ["fr", "en"];
export const DEFAULT_LOCALE: LangKeys = "fr";
export const LOCALE_STORAGE_KEY = "pfa.locale";

/** Endonyms shown in the language submenu — never translated. */
export const LOCALE_LABELS: Record<LangKeys, string> = {
  fr: "Français",
  en: "English",
};

/** BCP 47 tags driving number formatting; currency stays EUR (COS-155). */
export const NUMBER_LOCALES: Record<LangKeys, string> = {
  fr: "fr-FR",
  en: "en-US",
};

export const isSupportedLocale = (value: unknown): value is LangKeys =>
  typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
