"use client";

import useResetPasswordService from "@auth/useResetPasswordService";
import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import SharedLoginForm from "@src/components/shared/sharedLoginForm/sharedLoginForm";
import login from "@text/login";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { LoginValues } from "@components/shared/sharedLoginForm/interfaces";

export default function ForgotPassword() {
  const { resetPasswordService } = useResetPasswordService();
  const { forgotPassword: t } = login;

  const onSubmit = async (values: LoginValues) => {
    await resetPasswordService(values.email!);
  };

  return (
    <AuthCard>
      <AuthBrand
        title={t.title}
        subtitle={t.subtitle}
      />

      <SharedLoginForm
        onSubmit={onSubmit}
        buttonTitle={t.submit}
        displayEmailField
      />

      <div className="mt-5 flex justify-center border-t border-white/[0.07] pt-4.5">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="size-3.5"
            strokeWidth={2}
          />
          {t.backToLogin}
        </Link>
      </div>
    </AuthCard>
  );
}
