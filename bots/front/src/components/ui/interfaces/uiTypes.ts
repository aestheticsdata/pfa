import type { CursorPoint } from "@components/hooks/interfaces/cursorTypes";
import type { BUTTON_SIZE, BUTTON_VARIANT, TONE } from "@components/ui/variants";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];
export type ButtonSize = (typeof BUTTON_SIZE)[keyof typeof BUTTON_SIZE];
export type Tone = (typeof TONE)[keyof typeof TONE];

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export interface SwitchProps {
  on: boolean;
  label: string;
  onToggle: () => void;
  /** 38×22, the size of every switch but the drawer's. */
  small?: boolean;
  disabled?: boolean;
  testId?: string;
}

export interface TagProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export interface DotProps {
  tone?: Tone;
}

export interface CardProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}

export interface CardHeaderProps {
  title: string;
  /** The mono sub-line on the right (`always on · @synthetic.test`). */
  sub?: ReactNode;
  children?: ReactNode;
}

export interface LabelProps {
  children: ReactNode;
  className?: string;
}

export interface LocalTimeProps {
  iso: string;
  /** `TIME_FORMAT.clock` (17:56:20, default) or `TIME_FORMAT.day` (12/10 17:56). */
  format?: string;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** The mono line under the title (a time range, an id…); also the dialog's description. */
  sub?: ReactNode;
  /** Buttons, right-aligned under the body. */
  footer?: ReactNode;
  testId?: string;
  /** Extra classes for the box, e.g. a wider `tablet:max-w-…`. */
  className?: string;
  children: ReactNode;
}

export interface EyeIconProps {
  /** Struck through: the secret is visible, the button hides it. */
  crossed: boolean;
}

export interface CursorTooltipProps {
  /** The pointer, or null to fade the tooltip out. */
  point: CursorPoint | null;
  children: ReactNode;
}

/** A line of a tooltip: swatch, label, figure. */
export interface TooltipRow {
  label: string;
  value: string;
  /** A CSS colour for the swatch (a token: `var(--ok)`); none = no swatch. */
  color?: string;
  /** Draws the figure in the danger colour (errors, 5xx). */
  bad?: boolean;
}

export interface TooltipBodyProps {
  title: string;
  /** The mono line under the title (the time slot). */
  sub?: string;
  rows: TooltipRow[];
  /** The dim hint at the bottom (`Click for the detail`). */
  hint?: string;
}
