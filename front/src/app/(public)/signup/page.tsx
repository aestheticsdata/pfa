"use client";

import useCredentials from "@auth/helpers/useCredentials";
import useSignupService from "@auth/useSignupService";
import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import { AuthSwitchLink } from "@components/auth/AuthSwitchLink";
import SharedLoginForm from "@components/shared/sharedLoginForm/sharedLoginForm";
import useTranslations from "@i18n/useTranslations";

import type { LoginValues } from "@components/shared/sharedLoginForm/interfaces";

export default function SignUp() {
  const login = useTranslations("login");
  const { signupService } = useSignupService();
  const { setCredentials } = useCredentials();
  const { actions } = login;

  const onSubmit = async (values: LoginValues) => {
    const result = await signupService(values);
    if (result?.user && result.csrfToken) {
      await setCredentials(result);
    }
  };

  return (
    <AuthCard>
      <AuthBrand
        title={actions.createAccount}
        subtitle={login.brand.subtitle}
      />

      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle={actions.createAccount}
        displayEmailField
        displayPasswordField
        displayConfirmPasswordField
      />

      <AuthSwitchLink
        prompt={login.switch.toLogin}
        href="/login"
        label={actions.signIn}
      />
    </AuthCard>
  );
}
