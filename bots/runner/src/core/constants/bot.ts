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
  /** A load bot the ramp has not brought up (yet): above the target, or the load switch is off. */
  queued: "queued",
  sleeping: "sleeping",
  active: "active",
  paused: "paused",
  blocked: "blocked",
} as const;

/**
 * How load bots behave (PFA-128). `daily`: like real users — a few visits a day in waking hours,
 * reading pauses. `burst`: a stress test — a visit every few minutes, day and night, short pauses.
 */
export const LOAD_PACE = {
  daily: "daily",
  burst: "burst",
} as const;
