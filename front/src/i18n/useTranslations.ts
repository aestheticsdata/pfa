"use client";

import { useLocale } from "@i18n/LocaleContext";
import { dictionaries } from "@text/index";

import type { Dictionary, TextZone } from "@text/index";

/** Returns the requested text zone in the active locale. */
const useTranslations = <Z extends TextZone>(zone: Z): Dictionary[Z] => {
  const { locale } = useLocale();
  return dictionaries[locale][zone];
};

export default useTranslations;
