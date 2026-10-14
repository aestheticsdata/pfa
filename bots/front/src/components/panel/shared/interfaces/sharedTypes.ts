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

/** A figure of a detail: label, value, drawn in the danger colour when `bad`. */
export interface Fact {
  label: string;
  value: string;
  bad?: boolean;
}

export interface FactGridProps {
  facts: Fact[];
}

/** A bot in a list of the busiest: its figure as a bar (`value`) and as text (`label`). */
export interface BotBar {
  id: string;
  value: number;
  label: string;
}

export interface BotBarsProps {
  app: string;
  /** Busiest first. */
  bots: BotBar[];
  dailyIds: string[];
  /** Following a bot's link closes the modal. */
  onLeave: () => void;
}
