import { Label } from "@components/ui/label";
import { cn } from "@lib/utils";

import type { ReactNode } from "react";

interface FieldShellProps {
  label: ReactNode;
  htmlFor?: string;
  /** Error message rendered below the control (falsy = hidden). */
  error?: string;
  className?: string;
  children: ReactNode;
}

/** Vertical form-field wrapper: label + control slot + optional error message. */
function FieldShell({ label, htmlFor, error, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-sm text-ink-2"
      >
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-neg">{error}</p>}
    </div>
  );
}

export { FieldShell };
