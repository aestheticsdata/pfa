"use client";

import { useAuth } from "@auth/context/AuthContext";
import { ROUTES } from "@components/shared/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { useLocale } from "@i18n/LocaleContext";
import useUpdateLanguage from "@i18n/useUpdateLanguage";
import { useRouter } from "next/navigation";

const initialsFromEmail = (email?: string): string => {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : local.slice(0, 2);
  return (letters || "?").toUpperCase();
};

/**
 * Account identity + actions shared by the two places they are exposed: the
 * desktop dropdown (`UserMenu`) and the mobile drawer section
 * (`DrawerAccountSection`). Both must behave identically, so the logout and the
 * locale switch live here rather than in either component (COS-163).
 */
const useAccountActions = () => {
  const { user } = useAuth();
  const { privateRequest } = useRequestHelper();
  const { locale } = useLocale();
  const { updateLanguage } = useUpdateLanguage();
  const router = useRouter();

  const logout = async () => {
    try {
      await privateRequest("/users/logout", { method: "POST" });
    } catch {
      // Session may already be expired.
    } finally {
      // A full-document navigation tears down the React tree, the auth context and the
      // React Query cache on its own, then re-runs the server `(private)` guard — the same
      // hard-redirect path as `redirectToLogin`. Clearing that client state here first would
      // only repaint the current page with emptied data (a flash of the blank dashboard)
      // before the browser leaves, so we navigate straight away.
      window.location.replace(ROUTES.login.path);
    }
  };

  const goToChangePassword = () => router.push(ROUTES.changePassword.path);

  return {
    email: user?.email,
    initials: initialsFromEmail(user?.email),
    locale,
    updateLanguage,
    goToChangePassword,
    logout,
  };
};

export default useAccountActions;
