/** The two populations (PFA-120): a few permanent "daily" bots, and up to the cap of load bots (PFA-128). */
export const BOT_KIND = {
  daily: "daily",
  load: "load",
} as const;

/**
 * Where a bot is in its life. `blocked` is terminal until a human looks: its account cannot sign in
 * (disabled, purged, or refused by the app), and retrying would only hammer the app.
 */
export const BOT_STATE = {
  stopped: "stopped",
  sleeping: "sleeping",
  active: "active",
  paused: "paused",
  blocked: "blocked",
} as const;
