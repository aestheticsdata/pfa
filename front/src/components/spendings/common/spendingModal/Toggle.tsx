import { cn } from "@lib/utils";
import { Check } from "lucide-react";

import type { ReactNode } from "react";

const Toggle = ({
  active,
  onClick,
  disabled = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={cn(
      "inline-flex select-none items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
      active
        ? "border-accent-d bg-accent-strong/10 text-ink"
        : "border-line bg-surface-base text-ink-3 hover:text-ink-2",
      disabled && "cursor-not-allowed opacity-45 hover:text-ink-3",
    )}
  >
    <span
      className={cn(
        "grid size-3.5 place-items-center rounded-xs border",
        active ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-line bg-surface-hi",
      )}
    >
      {active && (
        <Check
          className="size-2.5"
          strokeWidth={3}
        />
      )}
    </span>
    {children}
  </button>
);

export default Toggle;
