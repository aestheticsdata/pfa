"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "react-query";
import { useUserStore } from "@auth/store/userStore";
import useRequestHelper from "@helpers/useRequestHelper";

export default function Logout() {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);
  const { request } = useRequestHelper();
  const didLogout = useRef(false);

  useEffect(() => {
    if (didLogout.current) return;
    didLogout.current = true;

    const doLogout = async () => {
      try {
        await request("/users/logout", { method: "POST" });
      } catch {
        // Session may already be expired
      } finally {
        queryClient.clear();
        setUser(null);
        window.location.href = "/";
      }
    };
    doLogout();
  }, [queryClient, setUser, request]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-grey1">
      <div className="font-ubuntu text-gray-500">Déconnexion en cours...</div>
    </div>
  );
}
