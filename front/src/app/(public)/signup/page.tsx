"use client";

import useCredentials from "@auth/helpers/useCredentials";
import useSignupService from "@auth/useSignupService";
import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import { AuthSwitchLink } from "@components/auth/AuthSwitchLink";
import SharedLoginForm from "@components/shared/sharedLoginForm/sharedLoginForm";

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

      <AuthSwitchLink
        prompt="Déjà un compte ?"
        href="/login"
        label="Se connecter"
      />
    </AuthCard>
  );
}
