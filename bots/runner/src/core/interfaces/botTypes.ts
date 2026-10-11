import type { BOT_KIND, BOT_STATE, LOAD_PACE } from "@core/constants/bot";
import type { BotActivityBucket, RecentRequest } from "@core/interfaces/metricsTypes";

export type BotKind = (typeof BOT_KIND)[keyof typeof BOT_KIND];
export type BotState = (typeof BOT_STATE)[keyof typeof BOT_STATE];
export type LoadPace = (typeof LOAD_PACE)[keyof typeof LOAD_PACE];

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
  /** Actions in the last minute. */
  actionsPerMin: number;
  /** Errors over all actions since the runner started, 0–1. */
  errorRate: number;
  /** The last 30 s in 2-second slices, oldest first. */
  spark: BotActivityBucket[];
  /** The last 24 h in 1-hour slices, oldest first (PFA-204). */
  daySpark: BotActivityBucket[];
  /** When its current session signed in; null when signed out. */
  sessionStartedAt: string | null;
  lastSeenAt: string | null;
  nextWakeAt: string | null;
}

/** A bot's drawer: its snapshot, what it did by action, and its last requests. */
export interface BotDetail extends BotSnapshot {
  byAction: Record<string, number>;
  recentRequests: RecentRequest[];
}

/** The change an operator asks for when toggling bots. */
export interface BotToggle {
  ids: string[];
  enabled: boolean;
}

/** What a bulk on/off reports. */
export interface BulkResult {
  updated: string[];
  unknown: string[];
}
