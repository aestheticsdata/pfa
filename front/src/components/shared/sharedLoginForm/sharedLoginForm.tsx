"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import getSymbolFromCurrency from "currency-symbol-map";
import currencyCodes from "@src/currency-codes.json";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { cn } from "@lib/utils";
import type { SharedLoginFormProps } from "@src/components/shared/sharedLoginForm/interfaces";

const buildSchema = (
  needEmail: boolean,
  needPassword: boolean,
  needConfirm: boolean,
  needCurrency: boolean,
) =>
  z
    .object({
      email: needEmail
        ? z.string().min(1, "Email requis").email("Email invalide")
        : z.string().optional(),
      password: needPassword
        ? z.string().min(1, "Mot de passe requis")
        : z.string().optional(),
      confirmPassword: needConfirm
        ? z.string().min(1, "Confirmation requise")
        : z.string().optional(),
      currency: needCurrency ? z.string().min(1) : z.string().optional(),
    })
    .refine((d) => !needConfirm || d.password === d.confirmPassword, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    });

const LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4";
const FIELD_ERROR = "text-[12px] text-neg";
const INPUT_BASE =
  "w-full rounded-[6px] border px-[13px] py-[11px] text-[14px] text-ink outline-none transition [background:oklch(0.12_0.008_250/0.75)] border-[oklch(0.30_0.010_250)] placeholder:text-ink-4 focus:border-[oklch(0.65_0.11_175)] focus:[background:oklch(0.13_0.008_250)] focus:shadow-[0_0_0_3px_oklch(0.65_0.11_175/0.15)] aria-invalid:border-neg";

const SharedLoginForm = ({
  onSubmit,
  buttonTitle,
  displayEmailField,
  displayPasswordField,
  displayConfirmPasswordField,
  displayCurrencyField,
  submitIcon,
}: SharedLoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = buildSchema(
    !!displayEmailField,
    !!displayPasswordField,
    !!displayConfirmPasswordField,
    !!displayCurrencyField,
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      currency: "EUR",
    },
  });

  const currency = watch("currency");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-4 text-foreground"
    >
      {displayEmailField && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={LABEL}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="vous@example.com"
            autoComplete="email"
            className={INPUT_BASE}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className={FIELD_ERROR}>{String(errors.email.message)}</p>
          )}
        </div>
      )}

      {displayPasswordField && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={LABEL}>
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete={
                displayConfirmPasswordField ? "new-password" : "current-password"
              }
              className={cn(INPUT_BASE, "pr-[42px]")}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-[7px] top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-4 transition-colors hover:bg-white/[0.06] hover:text-ink-2"
              tabIndex={-1}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <EyeOff className="size-[15px]" />
              ) : (
                <Eye className="size-[15px]" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className={FIELD_ERROR}>{String(errors.password.message)}</p>
          )}
        </div>
      )}

      {displayConfirmPasswordField && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className={LABEL}>
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn(INPUT_BASE, "pr-[42px]")}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-[7px] top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-4 transition-colors hover:bg-white/[0.06] hover:text-ink-2"
              tabIndex={-1}
              aria-label={
                showConfirm
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showConfirm ? (
                <EyeOff className="size-[15px]" />
              ) : (
                <Eye className="size-[15px]" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className={FIELD_ERROR}>
              {String(errors.confirmPassword.message)}
            </p>
          )}
        </div>
      )}

      {displayCurrencyField && (
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Devise</label>
          <Select
            value={currency || "EUR"}
            onValueChange={(value) =>
              setValue("currency", value, { shouldDirty: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Devise" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {currencyCodes.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name} : {getSymbolFromCurrency(c.code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="mt-1.5 h-auto w-full rounded-[10px] py-3 text-[14px] tracking-[0.01em]"
      >
        {buttonTitle}
        {submitIcon && <ArrowRight className="size-3.5" strokeWidth={2.5} />}
      </Button>
    </form>
  );
};

export default SharedLoginForm;
