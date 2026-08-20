"use client";

import useCredentials from "@auth/helpers/useCredentials";
import useLoginService from "@auth/useLoginService";
import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import { AuthSwitchLink } from "@components/auth/AuthSwitchLink";
import useTranslations from "@i18n/useTranslations";
import { report } from "@lib/report";
import SharedLoginForm from "@src/components/shared/sharedLoginForm/sharedLoginForm";
import Link from "next/link";
import { useState } from "react";

import type { LoginValues } from "@components/shared/interfaces/sharedLoginFormTypes";
import type { AxiosError } from "axios";

export default function LoginFormClient() {
  const login = useTranslations("login");
  const { loginService } = useLoginService();
  const { setCredentials } = useCredentials();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (values: LoginValues) => {
    try {
      const result = await loginService(values.email, values.password);
      if (result?.user && result.csrfToken) {
        setServerError(null);
        // Before setCredentials, which navigates: the reporter batches on a timer, and queueing
        // ahead of the route change is what guarantees the event is in the queue that survives it.
        // The IP is not sent — the browser does not know it; Iknos stamps the poster's address
        // server-side on events that carry none.
        report({ "log.level": "info", message: "login success", "event.action": "login" });
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
