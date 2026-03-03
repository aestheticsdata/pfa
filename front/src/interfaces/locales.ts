import localesDates from "@src/i18n/locales-dates";

export type LangKeys = keyof typeof localesDates;

// Locale from date-fns caused typing conflicts in this codebase.
// Keep this object flexible but strongly avoid `any`.
export interface LocaleObject {
  [k: string]: unknown;
  formatString: string;
}

export type LocalesObject = { [k: string]: LocaleObject };
