import type { BotDetailView, IncidentRow } from "@contracts/interfaces/panelTypes";

export interface CloseTargetRequest {
  app: string;
  bot: string;
  incident: string | null;
}

export interface CloseTargetData {
  bot: BotDetailView;
  incident: IncidentRow | null;
}
