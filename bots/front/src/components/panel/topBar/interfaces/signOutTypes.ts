import type { ButtonVariant } from "@components/ui/interfaces/uiTypes";

export interface SignOutButtonProps {
  variant?: ButtonVariant;
  className?: string;
  /** Full width, borderless: a menu row. */
  menuItem?: boolean;
}
