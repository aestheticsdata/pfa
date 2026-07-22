"use client";

import { overlineClass } from "@components/shared/Overline";
import { authInputClass } from "@components/shared/sharedLoginForm/authInputClass";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import type { UseFormRegisterReturn } from "react-hook-form";

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: string;
  invalid: boolean;
  registration: UseFormRegisterReturn;
}

/** Auth password input with its own show/hide toggle. */
const PasswordField = ({ id, label, autoComplete, invalid, registration }: PasswordFieldProps) => {
  const login = useTranslations("login");
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={overlineClass}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={autoComplete}
          className={cn(authInputClass, "pr-10.5")}
          aria-invalid={invalid}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-[7px] top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-4 transition-colors hover:bg-white/[0.06] hover:text-ink-2"
          tabIndex={-1}
          aria-label={show ? login.password.hide : login.password.show}
        >
          {show ? <EyeOff className="size-[15px]" /> : <Eye className="size-[15px]" />}
        </button>
      </div>
    </div>
  );
};

export { PasswordField };
