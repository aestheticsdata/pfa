"use client";

import SharedLoginForm from "@components/shared/sharedLoginForm/sharedLoginForm";
import useSignupService from "@auth/useSignupService";
import useCredentials from "@auth/helpers/useCredentials";

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
    <div className="auth-card-gradient w-full max-w-md p-8 rounded-xl border border-gray-700/40 shadow-2xl">
      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="Créer un compte"
        displayEmailField
        displayPasswordField
      />
    </div>
  );
}
