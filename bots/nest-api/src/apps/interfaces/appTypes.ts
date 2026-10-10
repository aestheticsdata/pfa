import type { z } from "zod";
import type { appsFileSchema } from "#app/apps/apps.schemas.js";
import type { RunnerClient } from "#app/runner/interfaces/runnerClientTypes.js";

export type AppsFile = z.infer<typeof appsFileSchema>;

/** One app the back-office drives, ready to use. */
export interface AppEntry {
  id: string;
  name: string;
  /** The machine its runner lives on (`ks-b`): shown in the top bar and the picker. */
  host: string;
  /** The runner's control address, for the picker's `host · addr` line. */
  address: string;
  /** The front's theme class (`pfa` → `.theme-pfa`); null = the bot-runner identity. */
  theme: string | null;
  timeZone: string;
  runner: RunnerClient;
  /** Glob of the app's log files the `synthetic-foreign-ip` alerts are read from; null = none. */
  alertLogs: string | null;
  /** The app's `SYNTHETIC_ALLOWED_IPS`, for the footer; null = not given. */
  allowedIps: string | null;
}
