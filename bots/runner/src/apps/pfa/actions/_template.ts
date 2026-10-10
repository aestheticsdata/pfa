/**
 * TEMPLATE — how to make the bots use a new PFA feature.
 *
 * 1. Copy this file in this folder, under a name that does NOT start with `_`
 *    (e.g. `addRecurring.ts`). Files starting with `_` are ignored by the runner.
 * 2. Fill in `name`, `description`, `weight` and `run()`. Add `canRun()` if the action only
 *    makes sense sometimes (e.g. "only if the bot has a spending to edit").
 * 3. That's it: the runner discovers the file at its next start. No list to edit, no engine change.
 *
 * Rules (guardrails — the runner's caps apply whatever an action does):
 * - Talk to PFA only through `ctx.client` (or a function of `api/pfaApi.ts` taking it): the bot is
 *   already signed in, the CSRF token and the global RPS cap are handled for you.
 * - Never touch another account, never hard-code an email: `ctx.bot` is the only identity.
 * - Amounts through `clampAmount`, dates through `plausibleDate`, categories from `CATEGORIES`.
 * - Uploading anything: only `loadReceipts()` pictures, and only after `ctx.uploads.reserve()`.
 * - Randomness through `ctx.rng` (seeded per bot), so a bot's behaviour is reproducible.
 * - Throw on failure: the runner counts the error, and a 401/403 from the API helpers re-signs the
 *   bot in or blocks it.
 */
import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotAction } from "@core/interfaces/actionTypes";

const templateAction: BotAction<PfaPersona> = {
  name: "feature.verb",
  description: "One sentence, shown in the back-office",
  weight: 10,
  canRun: (_ctx) => true,
  run: async (ctx) => {
    await ctx.client.get("/some-route");
  },
};

export default templateAction;
