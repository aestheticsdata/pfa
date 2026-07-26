"use client";

import useRequestHelper from "@helpers/useRequestHelper";
import { pickSupportedLocale } from "@i18n/pickSupportedLocale";
import useTranslations from "@i18n/useTranslations";
import { AuthResponseSchema } from "@src/schemas/auth";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { toast } from "sonner";

import type { AuthResponse } from "@auth/interfaces/authTypes";
import type { LoginValues } from "@components/shared/interfaces/sharedLoginFormTypes";
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
          // Users.name is a VarChar(20) and the signup form has no name field:
          // a long email local part used to reach the insert and fail as a raw
          // SQL error, with nothing the user could fix (COS-180).
          name: email.split("@")[0].slice(0, FIELD_LIMITS.userName),
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
