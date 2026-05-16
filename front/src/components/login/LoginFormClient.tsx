"use client";

import Link from "next/link";
import SharedLoginForm from "@src/components/shared/sharedLoginForm/sharedLoginForm";
import useLoginService from "@auth/useLoginService";
import useCredentials from "@auth/helpers/useCredentials";

import type { LoginValues } from "@src/components/shared/sharedLoginForm/interfaces";

export default function LoginFormClient() {
  const { loginService } = useLoginService();
  const { setCredentials } = useCredentials();

  const onSubmit = async (values: LoginValues) => {
    const result = await loginService(values.email!, values.password!);
    if (result?.user && result.csrfToken) {
      await setCredentials(result);
    }
  };

  return (
    <div className="auth-card-gradient w-full max-w-md flex flex-col gap-6 p-8 rounded-xl border border-gray-700/40 shadow-2xl">
      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="Se connecter"
        displayEmailField
        displayPasswordField
      />
      <div className="text-center text-sm text-gray-400">
        <Link
          href="/forgotPassword"
          prefetch={false}
          className="hover:text-cyan-400 transition-colors"
        >
          mot de passe oublié ?
        </Link>
      </div>
    </div>
  );
}
