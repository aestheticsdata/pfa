import type { IncidentRow } from "@contracts/interfaces/panelTypes";
import type { ReactNode } from "react";

export interface IncidentBannerProps {
  app: string;
  host: string;
  incidents: IncidentRow[];
}

export interface IncidentItemProps {
  app: string;
  incident: IncidentRow;
  now: number;
}

export interface IncidentActionsProps {
  app: string;
  incident: IncidentRow;
  /** Phone layout: two equal buttons side by side. */
  compact?: boolean;
}

export interface FieldBlockProps {
  label: string;
  value: ReactNode;
  /** The full value as a tooltip, when it may be cut off. */
  title?: string;
  sub?: string;
  big?: boolean;
}
