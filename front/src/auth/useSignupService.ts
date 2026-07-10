"use client";

import { toast } from "sonner";
import useRequestHelper from "@helpers/useRequestHelper";

import type { AxiosError } from "axios";
import type { LoginValues } from "@components/shared/sharedLoginForm/interfaces";
import type { AuthResponse } from "@auth/types";

const useSignupService = () => {
  const { request } = useRequestHelper();

  const signupService = async (
    user: LoginValues,
  ): Promise<AuthResponse | undefined> => {
    const { email, password } = user;
    try {
      const res = await request("/users/add", {
        method: "POST",
        data: {
          name: email!.split("@")[0],
          email,
          password,
          registerDate: new Date(),
          baseCurrency: "EUR",
          language: "fr",
        },
      });
      return res.data as AuthResponse;
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      toast.error(
        status === 409
          ? "Un compte existe déjà avec cet email."
          : "La création du compte a échoué. Réessaie.",
      );
    }
  };

  return {
    signupService,
  };
};

export default useSignupService;
