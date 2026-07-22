"use client";

import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AxiosError } from "axios";

const useResetPasswordService = () => {
  const login = useTranslations("login");
  const { request } = useRequestHelper();
  const router = useRouter();
  const { clearAuth } = useAuth();
  const { resetPassword: t } = login;

  const resetPasswordService = async (email: string) => {
    try {
      await request("/users/resetpassword", {
        method: "POST",
        data: {
          email,
          subject: t.emailSubject,
        },
      });
      toast.success(t.toastSuccess, {
        duration: 3000,
      });
      setTimeout(() => {
        clearAuth();
        router.push("/login");
      }, 600);
    } catch (err: unknown) {
      const description = (err as AxiosError<{ error?: string }>).response?.data?.error ?? "";
      toast.error(t.toastError, {
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
