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
    <div className="flex flex-col items-center w-96 space-y-8 mt-28 rounded-sm bg-linear-to-br from-teal-300 to-sky-500 py-3 font-smooch shadow-lg">
      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="login"
        displayEmailField
        displayPasswordField
      />
      <div className="text-formsGlobalColor hover:text-generalWarningBackground hover:underline">
        <Link href="/forgotPassword" prefetch={false}>
          mot de passe oublié ?
        </Link>
      </div>
    </div>
  );
}
