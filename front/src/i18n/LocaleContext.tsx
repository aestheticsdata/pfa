"use client";

import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_STORAGE_KEY } from "@i18n/config";
import { pickSupportedLocale } from "@i18n/pickSupportedLocale";
import { createContext, useContext, useEffect, useState } from "react";

import type { LangKeys } from "@src/interfaces/locales";

interface LocaleContextValue {
  locale: LangKeys;
  setLocale: (locale: LangKeys) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const readStoredLocale = (): LangKeys => {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isSupportedLocale(stored)) return stored;
  return pickSupportedLocale(window.navigator.languages ?? []);
};

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  // Two-pass init: the server (and first client render) always uses the FR
  // default, then the stored/browser locale is applied after mount. Costs EN
  // users one repaint on hard load but keeps hydration clean.
  const [locale, setLocaleState] = useState<LangKeys>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = (next: LangKeys) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // No `key` remount here: it would also remount AuthProvider (mounted below in
  // the (private) layout), resetting the auth state to its server-rendered
  // value and reverting the language the user just picked. Components stay in
  // sync by subscribing — useTranslations / useDateLocale / useFormat.
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
};
