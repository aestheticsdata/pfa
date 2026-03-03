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
    <div className="flex flex-col items-center w-96 space-y-8 mt-28 rounded-sm bg-linear-to-br from-teal-300 to-sky-500 py-3 font-smooch shadow-lg">
      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="Créer un compte"
        displayEmailField
        displayPasswordField
      />
    </div>
  );
}
