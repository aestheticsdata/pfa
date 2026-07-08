"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@auth/context/AuthContext";
import { ROUTES } from "@components/shared/config/constants";

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
    if (!pathname.startsWith(ROUTES.dashboard.path)) {
      router.replace(ROUTES.dashboard.path);
    }
  };

  return {
    setCredentials,
  };
};

export default useCredentials;
