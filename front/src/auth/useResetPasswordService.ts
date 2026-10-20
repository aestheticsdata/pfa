"use client";

import { useAuth } from "@auth/context/AuthContext";
import { isApiError } from "@helpers/http";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
      const body = isApiError(err) ? (err.response.data as { error?: string } | null) : null;
      const description = body?.error ?? "";
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
