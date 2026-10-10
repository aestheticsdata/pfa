import type { RunnerAction, RunnerBot } from "#app/runner/interfaces/runnerApiTypes.js";

/** A runner bot and what the back-office knows about it. */
export interface BotFacts {
  bot: RunnerBot;
  /** An open incident names it. */
  incident: boolean;
}

/** What splitting the current rate between actions needs. */
export interface ActionShare {
  actions: RunnerAction[];
  actionsPerMin: number;
  quietActive: boolean;
}

/** The Bots page's filters (query string). */
export interface BotsQuery {
  population: string;
  state: string;
  q: string;
  page: number;
}
