"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@auth/context/AuthContext";
import { DASHBOARD_PATH, buildDashboardPath } from "@helpers/dateRoute";

import type { AuthResponse } from "@auth/types";

const useCredentials = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { setAuthState } = useAuth();

  const setCredentials = (auth: AuthResponse) => {
    const normalizedUser = {
      ...auth.user,
      language: auth.user.language ?? "en",
    };
    setAuthState(normalizedUser, auth.csrfToken);
    if (!pathname.startsWith(DASHBOARD_PATH)) {
      router.replace(buildDashboardPath());
    }
  };

  return {
    setCredentials,
  };
};

export default useCredentials;
