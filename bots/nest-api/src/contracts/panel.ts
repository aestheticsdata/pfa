/**
 * The back-office's vocabulary, shared with the front (`bots/front` reads `contracts/` through a
 * path alias). No imports, so the folder stands on its own.
 */

/** A bot's state as the panel shows it (handoff: Running · Degraded · Paused · Queued · Stopped · Blocked). */
export const BOT_VIEW_STATE = {
  running: "running",
  degraded: "degraded",
  paused: "paused",
  queued: "queued",
  stopped: "stopped",
  blocked: "blocked",
} as const;

/** The two populations: 4 permanent bots, and up to 500 load bots. */
export const BOT_KIND = {
  daily: "daily",
  load: "load",
} as const;

export const INCIDENT_STATUS = {
  open: "open",
  acknowledged: "acknowledged",
  disabled: "disabled",
  purged: "purged",
} as const;

/** How a compromised account is closed. */
export const ACCOUNT_CLOSURE = {
  disable: "disable",
  purge: "purge",
} as const;

/** The Bots page's population filter. */
export const POPULATION = {
  all: "all",
  daily: "daily",
  load: "load",
} as const;

export const BOTS_PAGE_SIZE = 20;
