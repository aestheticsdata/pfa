import type { ReactNode } from "react";

export interface ToastState {
  message: string | null;
  /** The mobile bulk bar is up: the toast sits above it. */
  raised: boolean;
  show: (message: string) => void;
  setRaised: (raised: boolean) => void;
}

export interface BoundaryProps {
  children: ReactNode;
  /** Shown in the fallback ("Couldn’t load the bots"). */
  title?: string;
}

export interface SectionProps {
  children: ReactNode;
  className?: string;
}

export interface SectionLabelProps {
  label: string;
  /** The mono value on the right (`80 live / 120`, `starts at 22:00`…). */
  children?: ReactNode;
}

export interface PendingBarProps {
  /** `120 → 200`, `22:00 → 10:00  ⟶  23:00 → 09:00`. */
  change: string;
  onCancel: () => void;
  onApply: () => void;
  busy?: boolean;
}

export interface EmptyNoticeProps {
  children: ReactNode;
}
