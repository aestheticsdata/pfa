import type { IncidentRow, IncidentsView, PushState } from "@contracts/interfaces/panelTypes";

export interface IncidentsCardProps {
  view: IncidentsView;
}

export interface IncidentStatusTagProps {
  incident: IncidentRow;
}

export interface PushCardProps {
  push: PushState;
}
