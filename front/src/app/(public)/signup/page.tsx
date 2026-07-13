"use client";

import useCredentials from "@auth/helpers/useCredentials";
import useSignupService from "@auth/useSignupService";
import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import SharedLoginForm from "@components/shared/sharedLoginForm/sharedLoginForm";
import Link from "next/link";

import type { LoginValues } from "@components/shared/sharedLoginForm/interfaces";

export default function SignUp() {
  const { signupService } = useSignupService();
  const { setCredentials } = useCredentials();

  const onSubmit = async (values: LoginValues) => {
    const result = await signupService(values);
    if (result?.user && result.csrfToken) {
      await setCredentials(result);
    }
  };

  return (
    <AuthCard>
      <AuthBrand
        title="Créer un compte"
        subtitle="Chaque euro à sa place."
      />

      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="Créer un compte"
        displayEmailField
        displayPasswordField
        displayConfirmPasswordField
      />

      <div className="mt-5 flex justify-center gap-1.5 border-t border-white/[0.07] pt-[18px] text-[12.5px] text-ink-3">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-medium text-[oklch(0.82_0.12_165)] hover:underline"
        >
          Se connecter
        </Link>
      </div>
    </AuthCard>
  );
}
