"use client";

import { usePathname } from "next/navigation";
import { useUserStore } from "@auth/store/userStore";

const useCredentials = () => {
  const setUser = useUserStore((state) => state.setUser);
  const pathname = usePathname();

  const setCredentials = (user: { id: string; name: string; email: string; baseCurrency: string; language: string | null }) => {
    setUser({ ...user, language: user.language ?? "en" });
    if (pathname !== "/") {
      window.location.href = "/";
    }
  };

  return {
    setCredentials,
  };
};

export default useCredentials;
