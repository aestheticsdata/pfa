"use client";

import { useAuth } from "@auth/context/AuthContext";
import { isSupportedLocale } from "@i18n/config";
import { useLocale } from "@i18n/LocaleContext";
import { useEffect } from "react";

/**
 * Applies the signed-in user's persisted language to the locale context:
 * the backend value is the cross-device source of truth and wins over
 * localStorage. Mounted in the (private) layout, renders nothing.
 */
const LocaleUserSync = () => {
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();
  const userLanguage = user?.language;

  useEffect(() => {
    if (isSupportedLocale(userLanguage) && userLanguage !== locale) {
      setLocale(userLanguage);
    }
  }, [userLanguage, locale, setLocale]);

  return null;
};

export default LocaleUserSync;
