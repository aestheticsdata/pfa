"use client";

import Link from "next/link";
import { useState } from "react";
import type { AxiosError } from "axios";
import AuthCard from "@components/auth/AuthCard";
import AuthBrand from "@components/auth/AuthBrand";
import SharedLoginForm from "@src/components/shared/sharedLoginForm/sharedLoginForm";
import useLoginService from "@auth/useLoginService";
import useCredentials from "@auth/helpers/useCredentials";

import type { LoginValues } from "@src/components/shared/sharedLoginForm/interfaces";

export default function LoginFormClient() {
  const { loginService } = useLoginService();
  const { setCredentials } = useCredentials();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (values: LoginValues) => {
    try {
      const result = await loginService(values.email!, values.password!);
      if (result?.user && result.csrfToken) {
        setServerError(null);
        await setCredentials(result);
      }
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      setServerError(
        status === 401
          ? "Email ou mot de passe incorrect."
          : "Une erreur est survenue. Réessaie.",
      );
    }
  };

  return (
    <AuthCard>
      <AuthBrand
        title="Personal Finance Assistant"
        subtitle="Chaque euro à sa place."
      />

      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="Se connecter"
        displayEmailField
        displayPasswordField
        submitIcon
        serverError={serverError}
        onDismissError={() => setServerError(null)}
      />

      <div className="mt-4 text-center">
        <Link
          href="/forgotPassword"
          prefetch={false}
          className="text-[12.5px] text-ink-3 transition-colors hover:text-ink"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <div className="mt-5 flex justify-center gap-1.5 border-t border-white/[0.07] pt-[18px] text-[12.5px] text-ink-3">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-medium text-[oklch(0.82_0.12_165)] hover:underline"
        >
          Créer un compte
        </Link>
      </div>
    </AuthCard>
  );
}
