"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import getSymbolFromCurrency from "currency-symbol-map";
import currencyCodes from "@src/currency-codes.json";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
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
  needCurrency: boolean,
) =>
  z.object({
    email: needEmail
      ? z.string().min(1, "Email requis").email("Email invalide")
      : z.string().optional(),
    password: needPassword
      ? z.string().min(1, "Mot de passe requis")
      : z.string().optional(),
    currency: needCurrency ? z.string().min(1) : z.string().optional(),
  });

const SharedLoginForm = ({
  onSubmit,
  buttonTitle,
  displayEmailField,
  displayPasswordField,
  displayCurrencyField,
}: SharedLoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const schema = buildSchema(
    !!displayEmailField,
    !!displayPasswordField,
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
    defaultValues: { email: "", password: "", currency: "EUR" },
  });

  const currency = watch("currency");

  return (
    <div className="flex w-full flex-col items-center gap-8 text-foreground">
      <div className="text-2xl font-light tracking-tight text-gray-100">
        Personal Finance Assistant
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-5"
      >
        {displayEmailField && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@example.com"
              autoComplete="email"
              className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus-visible:border-cyan-500"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {String(errors.email.message)}
              </p>
            )}
          </div>
        )}

        {displayPasswordField && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-gray-300">
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus-visible:border-cyan-500 pr-10"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {String(errors.password.message)}
              </p>
            )}
          </div>
        )}

        {displayCurrencyField && (
          <div className="flex flex-col gap-2">
            <Label className="text-gray-300">Devise</Label>
            <Select
              value={currency || "EUR"}
              onValueChange={(value) =>
                setValue("currency", value, { shouldDirty: true })
              }
            >
              <SelectTrigger className="w-full bg-[#0c0c0c] border-gray-700/50 text-gray-100">
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
          variant="accent"
          size="lg"
          disabled={isSubmitting}
          className={cn("mt-2 w-full uppercase tracking-wide")}
        >
          {buttonTitle}
        </Button>
      </form>
    </div>
  );
};

export default SharedLoginForm;
