"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useRequestHelper from "@helpers/useRequestHelper";
import { useAuth } from "@auth/context/AuthContext";

import type { AxiosError } from "axios";

const useResetPasswordService = () => {
  const { request } = useRequestHelper();
  const router = useRouter();
  const { clearAuth } = useAuth();

  const resetPasswordService = async (email: string) => {
    try {
      await request("/users/resetpassword", {
        method: "POST",
        data: {
          email,
          subject: "PFA - changement de mot de passe",
        },
      });
      toast.success("Un nouveau mot de passe vous a été envoyé", {
        duration: 3000,
      });
      setTimeout(() => {
        clearAuth();
        router.push("/login");
      }, 600);
    } catch (err: unknown) {
      const description =
        (err as AxiosError<{ error?: string }>).response?.data?.error ?? "";
      toast.error("Le mot de passe n'a pas pu être ré-initialisé", {
        description,
        duration: 3000,
      });
    }
  };

  return {
    resetPasswordService,
  };
};

export default useResetPasswordService;
