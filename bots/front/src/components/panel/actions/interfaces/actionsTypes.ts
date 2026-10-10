import type { ActionsView, ActionView } from "@contracts/interfaces/panelTypes";

export interface ActionsCardProps {
  app: string;
  view: ActionsView;
  running: boolean;
}

export interface ActionTagsProps {
  action: ActionView;
}
