"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "react-query";
import { useUserStore } from "@auth/store/userStore";
import useRequestHelper from "@helpers/useRequestHelper";

export default function Logout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userStore = useUserStore();
  const { request } = useRequestHelper();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await request("/users/logout", { method: "POST" });
      } catch {
        // Session may already be expired
      } finally {
        queryClient.clear();
        userStore.setUser(null);
        router.replace("/login");
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    };
    doLogout();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-grey1">
      <div>Déconnexion en cours...</div>
    </div>
  );
}

