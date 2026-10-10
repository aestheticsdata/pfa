import type { BotDetailView, IncidentRow } from "@contracts/interfaces/panelTypes";
import type { ReactNode } from "react";

export interface CloseAccountModalProps {
  app: string;
  bot: BotDetailView;
  /** The incident it answers, when opened from the banner: its address shows, and it is acknowledged. */
  incident: IncidentRow | null;
  intercepted: boolean;
}

export interface ClosureOptionProps {
  checked: boolean;
  onSelect: () => void;
  title: ReactNode;
  description: string;
  testId: string;
}
