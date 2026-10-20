import type { LOCALE } from "@i18n/config";

export type LangKeys = (typeof LOCALE)[keyof typeof LOCALE];
