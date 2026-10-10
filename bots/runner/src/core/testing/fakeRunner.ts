import { BOT_KIND } from "@core/constants/bot";
import { Runner } from "@core/engine/runner";
import { RateLimiter } from "@core/limits/rateLimiter";
import { UploadBudget } from "@core/limits/uploadBudget";
import { BotSecrets } from "@core/storage/botSecrets";

import type { AppDefinition } from "@core/interfaces/appTypes";
import type { PersistedRunnerState } from "@core/interfaces/runnerTypes";
import type { FakeRunnerOptions } from "@core/testing/interfaces/fakeRunnerTypes";

/** A runner over a fake app (no HTTP): for testing the engine and the control API in isolation. */
export async function fakeRunner(options: FakeRunnerOptions = {}): Promise<Runner<unknown>> {
  const app: AppDefinition<unknown> = {
    id: "fake",
    name: "Fake",
    baseUrl: "http://127.0.0.1:9",
    syntheticDomain: "synthetic.test",
    bots: (options.emails ?? ["bot@synthetic.test"]).map((email, i) => ({
      id: `bot-${i}`,
      email,
      kind: BOT_KIND.daily,
      persona: {},
    })),
    actionsDir: "/nonexistent",
    authenticate: options.authenticate ?? (async () => {}),
  };
  const saved: PersistedRunnerState[] = options.saved ?? [];
  return new Runner({
    app,
    actions: options.actions ?? [],
    limits: { maxBots: options.maxBots ?? 500, maxRps: 1000, uploadBudgetBytes: 1024, uploadWindowDays: 365 },
    limiter: new RateLimiter(1000),
    uploads: new UploadBudget({ budgetBytes: 1024, windowMs: 1000, entries: [] }),
    secrets: await BotSecrets.load(options.secretsPath ?? "/tmp/bot-runner-test-secrets.json"),
    initialState: options.initialState ?? { running: false, disabledBots: [], disabledActions: [] },
    saveState: async (state) => {
      saved.push(structuredClone(state));
    },
  });
}
