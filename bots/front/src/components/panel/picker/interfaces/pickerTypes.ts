import type { AppSummary } from "@contracts/interfaces/panelTypes";

export interface AppPickerProps {
  apps: AppSummary[];
  email: string;
}

export interface AppCardProps {
  app: AppSummary;
}
