import { Label } from "@components/ui/label";
import { cn } from "@lib/utils";

import type { ReactNode } from "react";

interface FieldShellProps {
  label: ReactNode;
  htmlFor?: string;
  /** Error message rendered below the control (falsy = hidden). */
  error?: string;
  /** Overrides the default `text-sm` label size (e.g. `text-[13px]`). */
  labelClassName?: string;
  className?: string;
  children: ReactNode;
}

/** Vertical form-field wrapper: label + control slot + optional error message. */
function FieldShell({ label, htmlFor, error, labelClassName, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn("text-sm text-ink-2", labelClassName)}
      >
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-neg">{error}</p>}
    </div>
  );
}

export { FieldShell };
