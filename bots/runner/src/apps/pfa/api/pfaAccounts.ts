import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { AccountAdmin } from "@core/interfaces/appTypes";
import type { BotProfile } from "@core/interfaces/botTypes";

const TIMEOUT_MS = 15_000;

/**
 * PFA's half of "Disable / purge account" (PFA-127): its internal route, straight to the API on
 * 127.0.0.1 — never through nginx, which is exactly what that route requires, along with the
 * service token. Without a token there is no admin at all: the back-office says the app can't.
 */
export function pfaAccounts(env: NodeJS.ProcessEnv): AccountAdmin<PfaPersona> | undefined {
  const token = env.SYNTHETIC_ADMIN_TOKEN ?? "";
  if (token.length < 32) {
    return undefined;
  }
  const baseUrl = (env.PFA_INTERNAL_API_URL ?? "http://127.0.0.1:6100/api").replace(/\/$/, "");
  const call = async (bot: BotProfile<PfaPersona>, purge: boolean): Promise<void> => {
    const path = `/internal/synthetic/accounts/${encodeURIComponent(bot.email)}${purge ? "" : "/disable"}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method: purge ? "DELETE" : "POST",
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`PFA answered ${res.status}`);
    }
  };
  return {
    disable: (bot) => call(bot, false),
    purge: (bot) => call(bot, true),
  };
}
