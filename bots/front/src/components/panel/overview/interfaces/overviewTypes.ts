import type { BotView, OverviewView, QuietHoursView, StatusView } from "@contracts/interfaces/panelTypes";
import type { ReactNode } from "react";

export interface OverviewProps {
  app: string;
  appName: string;
  configured: boolean;
  view: OverviewView;
}

export interface ControlProps {
  app: string;
  status: StatusView;
}

export interface QuietHoursProps {
  app: string;
  quiet: QuietHoursView;
}

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  sub: ReactNode;
  /** Colour of the big number (warn / bad thresholds). */
  valueClass?: string;
}

export interface DailyBotsCardProps {
  app: string;
  bots: BotView[];
}

export interface StatusCardProps {
  status: StatusView;
  actions: number[];
  /** `actions` are the last 24 h, one an hour (daily pace), not the last 80 s (PFA-204). */
  day: boolean;
}

export interface StatusOnlyProps {
  status: StatusView;
}
