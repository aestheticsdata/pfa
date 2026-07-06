"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AuthCard from "@components/auth/AuthCard";
import AuthBrand from "@components/auth/AuthBrand";
import SharedLoginForm from "@src/components/shared/sharedLoginForm/sharedLoginForm";
import useResetPasswordService from "@auth/useResetPasswordService";

import type { LoginValues } from "@components/shared/sharedLoginForm/interfaces";

export default function ForgotPassword() {
  const { resetPasswordService } = useResetPasswordService();

  const onSubmit = async (values: LoginValues) => {
    await resetPasswordService(values.email!);
  };

  return (
    <AuthCard>
      <AuthBrand
        title="Mot de passe oublié ?"
        subtitle="On t'envoie un lien de réinitialisation."
      />

      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle="Réinitialiser le mot de passe"
        displayEmailField
      />

      <div className="mt-5 flex justify-center border-t border-white/[0.07] pt-[18px]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          Retour à la connexion
        </Link>
      </div>
    </AuthCard>
  );
}
