"use client";

import useCredentials from "@auth/helpers/useCredentials";
import useSignupService from "@auth/useSignupService";
import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import { AuthSwitchLink } from "@components/auth/AuthSwitchLink";
import SharedLoginForm from "@components/shared/sharedLoginForm/sharedLoginForm";
import useTranslations from "@i18n/useTranslations";

import type { LoginValues } from "@components/shared/interfaces/sharedLoginFormTypes";

/**
 * Locked down, not hidden (COS-419). `NEXT_PUBLIC_SIGNUPS_ENABLED === "false"` disables every
 * field and the submit button while leaving the page and the form exactly where they are — the
 * API refuses `POST /users/add` regardless, so this is a visible "no" rather than the actual gate.
 */
const signupsEnabled = process.env.NEXT_PUBLIC_SIGNUPS_ENABLED !== "false";

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
        disabled={!signupsEnabled}
      />

      <AuthSwitchLink
        prompt={login.switch.toLogin}
        href="/login"
        label={actions.signIn}
      />
    </AuthCard>
  );
}
