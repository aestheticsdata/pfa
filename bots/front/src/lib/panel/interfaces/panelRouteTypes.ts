import type { PANEL_VIEW } from "@lib/panel/views";

export type PanelView = (typeof PANEL_VIEW)[keyof typeof PANEL_VIEW];

/** The account-closure modal's address: which bot, and the incident it answers, if any. */
export interface CloseTarget {
  app: string;
  bot: string;
  incident?: string;
}
