"use client";

import { overlineClass } from "@components/shared/Overline";
import { authInputClass } from "@components/shared/sharedLoginForm/authInputClass";
import { PasswordField } from "@components/shared/sharedLoginForm/PasswordField";
import { Button } from "@components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import currencyCodes from "@src/currency-codes.json";
import login from "@text/login";
import getSymbolFromCurrency from "currency-symbol-map";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { SharedLoginFormProps } from "@src/components/shared/sharedLoginForm/interfaces";

const buildSchema = (needEmail: boolean, needPassword: boolean, needConfirm: boolean, needCurrency: boolean) =>
  z
    .object({
      email: needEmail
        ? z.string().min(1, login.validation.emailRequired).email(login.validation.emailInvalid)
        : z.string().optional(),
      password: needPassword ? z.string().min(1, login.validation.passwordRequired) : z.string().optional(),
      confirmPassword: needConfirm ? z.string().min(1, login.validation.confirmRequired) : z.string().optional(),
      currency: needCurrency ? z.string().min(1) : z.string().optional(),
    })
    .refine((d) => !needConfirm || d.password === d.confirmPassword, {
      message: login.validation.passwordMismatch,
      path: ["confirmPassword"],
    });

const LABEL = overlineClass;

/**
 * Single shared message slot for the auth forms. Always rendered — it reserves one
 * line so the layout never shifts — and shows whichever message is injected: the
 * server error (bad credentials…) or the first field-validation error. Rendered once,
 * between the fields and the submit button.
 */
const FormMessage = ({ message }: { message?: string | null }) => (
  <p
    role="alert"
    className="min-h-5 text-sm leading-5 text-neg"
  >
    {message ?? ""}
  </p>
);

const SharedLoginForm = ({
  onSubmit,
  buttonTitle,
  displayEmailField,
  displayPasswordField,
  displayConfirmPasswordField,
  displayCurrencyField,
  submitIcon,
  serverError,
  onDismissError,
}: SharedLoginFormProps) => {
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
    clearErrors,
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

  const { fields } = login;

  const currency = watch("currency");

  // The server error (injected by the parent) takes precedence over the first
  // field-validation error; both surface in the single FormMessage slot below.
  const fieldError =
    errors.email?.message || errors.password?.message || errors.confirmPassword?.message || errors.currency?.message;
  const formMessage = serverError || (fieldError ? String(fieldError) : null);

  const clearFieldError = (field: keyof FormValues) => () => {
    clearErrors(field);
    onDismissError?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-4 text-foreground"
    >
      {displayEmailField && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className={LABEL}
          >
            {fields.emailLabel}
          </label>
          <input
            id="email"
            type="email"
            placeholder={fields.emailPlaceholder}
            autoComplete="email"
            className={authInputClass}
            aria-invalid={!!errors.email}
            {...register("email", { onChange: clearFieldError("email") })}
          />
        </div>
      )}

      {displayPasswordField && (
        <PasswordField
          id="password"
          label={fields.passwordLabel}
          autoComplete={displayConfirmPasswordField ? "new-password" : "current-password"}
          invalid={!!errors.password}
          registration={register("password", { onChange: clearFieldError("password") })}
        />
      )}

      {displayConfirmPasswordField && (
        <PasswordField
          id="confirmPassword"
          label={fields.confirmPasswordLabel}
          autoComplete="new-password"
          invalid={!!errors.confirmPassword}
          registration={register("confirmPassword", { onChange: clearFieldError("confirmPassword") })}
        />
      )}

      {displayCurrencyField && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="currency"
            className={LABEL}
          >
            {fields.currencyLabel}
          </label>
          <Select
            value={currency || "EUR"}
            onValueChange={(value) => setValue("currency", value, { shouldDirty: true })}
          >
            <SelectTrigger
              id="currency"
              className="w-full"
            >
              <SelectValue placeholder={fields.currencyLabel} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {currencyCodes.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                >
                  {c.name} : {getSymbolFromCurrency(c.code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <FormMessage message={formMessage} />

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="h-auto w-full rounded-lg py-3 text-sm tracking-normal"
      >
        {buttonTitle}
        {submitIcon && (
          <ArrowRight
            className="size-3.5"
            strokeWidth={2.5}
          />
        )}
      </Button>
    </form>
  );
};

export default SharedLoginForm;
