"use client";

import { useRouter } from "next/navigation";
import { useUserStore } from "@auth/store/userStore";

const useCredentials = () => {
  const router = useRouter();
  const userStore = useUserStore();

  const setCredentials = async (user: { id: string; name: string; email: string; baseCurrency: string; language: string | null }) => {
    userStore.setUser({ ...user, language: user.language ?? "en" });
    await router.push("/");
  };

  return {
    setCredentials,
  };
};

export default useCredentials;
