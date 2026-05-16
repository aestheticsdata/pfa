"use client";

import SharedLoginForm from "@src/components/shared/sharedLoginForm/sharedLoginForm";
import useResetPasswordService from "@auth/useResetPasswordService";

import type { LoginValues } from "@components/shared/sharedLoginForm/interfaces";

export default function ForgotPassword() {
  const { resetPasswordService } = useResetPasswordService();

  const onSubmit = async (values: LoginValues) => {
    await resetPasswordService(values.email!);
  };

  return (
    <div className="auth-card-gradient w-full max-w-md p-8 rounded-xl border border-gray-700/40 shadow-2xl">
      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="Réinitialiser le mot de passe"
        displayEmailField
      />
    </div>
  );
}
