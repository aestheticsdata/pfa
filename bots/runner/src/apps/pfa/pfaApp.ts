import { fileURLToPath } from "node:url";
import { pfaAccounts } from "@apps/pfa/api/pfaAccounts";
import { authenticate } from "@apps/pfa/api/pfaApi";
import { PFA_DAILY_BOTS, PFA_LOAD_BOTS, PFA_SYNTHETIC_DOMAIN, PFA_TIME_ZONE } from "@apps/pfa/persona/bots";

import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { AppDefinition } from "@core/interfaces/appTypes";

/**
 * PFA's adapter: everything the generic runner needs to know about PFA, and nothing more.
 * `PFA_API_URL` is the public API (https://pfa.1991computer.com/api in production), so the bots
 * cross nginx and the IP lock like any visitor; locally, the dev API.
 */
export function pfaApp(env: NodeJS.ProcessEnv): AppDefinition<PfaPersona> {
  return {
    id: "pfa",
    name: "PFA",
    baseUrl: (env.PFA_API_URL ?? "http://127.0.0.1:6100/api").replace(/\/$/, ""),
    timeZone: PFA_TIME_ZONE,
    // No new spending between 22:00 and 10:00 Paris time by default; changed from the back-office.
    defaultQuietHours: { from: "22:00", to: "10:00" },
    syntheticDomain: PFA_SYNTHETIC_DOMAIN,
    bots: PFA_DAILY_BOTS,
    loadBots: PFA_LOAD_BOTS,
    actionsDir: fileURLToPath(new URL("actions", import.meta.url)),
    authenticate,
    accounts: pfaAccounts(env),
  };
}
