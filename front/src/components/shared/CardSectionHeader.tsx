import { cn } from "@lib/utils";

import type { ReactNode } from "react";

/**
 * Card heading — the single home of the card-title type ramp. Use it directly
 * inside cards whose header layout is bespoke (stacked subtitle, inline edit
 * control…); use `CardSectionHeader` for the common one-row shape.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-base font-semibold tracking-normal text-ink", className)}
      {...props}
    />
  );
}

interface CardSectionHeaderProps {
  title: ReactNode;
  /** Muted right-aligned meta text. */
  meta?: ReactNode;
  /** Right-aligned control (button/form); takes the place of `meta` when both are given. */
  action?: ReactNode;
  className?: string;
}

/** Common card header row: title on the left, muted meta or an action control on the right. */
function CardSectionHeader({ title, meta, action, className }: CardSectionHeaderProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <CardTitle>{title}</CardTitle>
      {action ?? (meta != null ? <span className="text-xs text-ink-4">{meta}</span> : null)}
    </div>
  );
}

export { CardSectionHeader, CardTitle };
