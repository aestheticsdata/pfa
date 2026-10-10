import type { BOTS_MODE } from "#app/config/app.config.js";

export type BotsMode = (typeof BOTS_MODE)[keyof typeof BOTS_MODE];

export interface AppConfig {
  port: number;
  /**
   * `mock`: every app is served by a simulated runner (deterministic, seeded) and a fictional second
   * app shows the picker — local dev and the portfolio film. `live`: the real runners. Never mock in
   * production: the ecosystem file sets `live`, and so does the default.
   */
  mode: BotsMode;
  /** The apps the back-office drives (live mode): their runner's address and token, theme, zone. */
  appsFile: string;
  /** Web Push (incident notifications). Both unset = no push, everything else works. */
  vapidPublicKey: string | null;
  vapidPrivateKey: string | null;
  vapidSubject: string;
}
