"use client";

import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import { useLocale } from "@i18n/LocaleContext";
import useTranslations from "@i18n/useTranslations";
import { toast } from "sonner";

import type { LangKeys } from "@i18n/interfaces/localesTypes";

/**
 * Switches the app locale and persists it: optimistic context updates (locale +
 * auth user, keeping LocaleUserSync consistent), then PATCH /users/me. Reverts
 * both on failure.
 */
const useUpdateLanguage = () => {
  const { privateRequest } = useRequestHelper();
  const { user, setUser } = useAuth();
  const { locale, setLocale } = useLocale();
  const { userMenu: t } = useTranslations("navBar");

  const updateLanguage = async (next: LangKeys) => {
    if (!user || next === locale) return;
    const previousUser = user;
    const previousLocale = locale;

    setUser({ ...user, language: next });
    setLocale(next);
    try {
      await privateRequest("/users/me", { method: "PATCH", data: { language: next } });
    } catch {
      setUser(previousUser);
      setLocale(previousLocale);
      toast.error(t.languageUpdateError);
    }
  };

  return { updateLanguage };
};

export default useUpdateLanguage;
