"use client";

import useCredentials from "@auth/helpers/useCredentials";
import useLoginService from "@auth/useLoginService";
import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import { AuthSwitchLink } from "@components/auth/AuthSwitchLink";
import SharedLoginForm from "@src/components/shared/sharedLoginForm/sharedLoginForm";
import login from "@text/login";
import Link from "next/link";
import { useState } from "react";

import type { LoginValues } from "@src/components/shared/sharedLoginForm/interfaces";
import type { AxiosError } from "axios";

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
      setServerError(status === 401 ? login.errors.invalidCredentials : login.errors.generic);
    }
  };

  return (
    <AuthCard>
      <AuthBrand
        title={login.brand.title}
        subtitle={login.brand.subtitle}
      />

      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle={login.actions.signIn}
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
          className="text-xs text-ink-3 transition-colors hover:text-ink"
        >
          {login.forgotPassword.title}
        </Link>
      </div>

      <AuthSwitchLink
        prompt={login.switch.toSignup}
        href="/signup"
        label={login.actions.createAccount}
      />
    </AuthCard>
  );
}
