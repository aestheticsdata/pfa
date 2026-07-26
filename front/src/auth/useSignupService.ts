"use client";

import useRequestHelper from "@helpers/useRequestHelper";
import { pickSupportedLocale } from "@i18n/pickSupportedLocale";
import useTranslations from "@i18n/useTranslations";
import { AuthResponseSchema } from "@src/schemas/auth";
import { toast } from "sonner";

import type { AuthResponse } from "@auth/types";
import type { LoginValues } from "@components/shared/sharedLoginForm/interfaces";
import type { AxiosError } from "axios";

const useSignupService = () => {
  const { request } = useRequestHelper();
  const { signup: t } = useTranslations("login");

  const signupService = async (user: LoginValues): Promise<AuthResponse | undefined> => {
    const { email, password } = user;
    try {
      const res = await request("/users/add", {
        method: "POST",
        data: {
          name: email.split("@")[0],
          email,
          password,
          registerDate: new Date(),
          baseCurrency: "EUR",
          language: pickSupportedLocale(navigator.languages ?? []),
        },
      });
      return AuthResponseSchema.parse(res.data);
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      toast.error(status === 409 ? t.emailAlreadyExists : t.error);
    }
  };

  return {
    signupService,
  };
};

export default useSignupService;
