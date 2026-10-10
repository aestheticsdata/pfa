import type { ActionView } from "@contracts/interfaces/panelTypes";

export interface ActionAppProps {
  app: string;
}

export interface ActionSwitchProps extends ActionAppProps {
  action: ActionView;
}
