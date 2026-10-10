import type { BOT_KIND, BOT_STATE } from "@core/constants/bot";

export type BotKind = (typeof BOT_KIND)[keyof typeof BOT_KIND];
export type BotState = (typeof BOT_STATE)[keyof typeof BOT_STATE];

/** Who a bot is. `persona` is the app's own data about it (what it buys, how often): the core never reads it. */
export interface BotProfile<TPersona = unknown> {
  id: string;
  email: string;
  kind: BotKind;
  persona: TPersona;
}

/** One bot's counters, as the control API reports them. */
export interface BotSnapshot {
  id: string;
  email: string;
  kind: BotKind;
  state: BotState;
  enabled: boolean;
  currentAction: string | null;
  totalActions: number;
  errors: number;
  uploads: number;
  lastSeenAt: string | null;
  nextWakeAt: string | null;
}
