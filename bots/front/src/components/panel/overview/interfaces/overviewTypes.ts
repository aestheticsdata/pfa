import type {
  ActivityPoint,
  BotView,
  OverviewView,
  QuietHoursView,
  StatusView,
} from "@contracts/interfaces/panelTypes";
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
  /** The last 80 s (burst) or, with `day`, the last 24 h in 15-minute slices (daily pace, PFA-206). */
  history: ActivityPoint[];
  day: boolean;
  /** The registry's actions, in order: the day chart's colours. */
  actionNames: string[];
}

export interface DayChartProps {
  history: ActivityPoint[];
  actionNames: string[];
}

export interface SliceDetailModalProps {
  point: ActivityPoint;
  actionNames: string[];
  onClose: () => void;
}

export interface StatusOnlyProps {
  status: StatusView;
}
