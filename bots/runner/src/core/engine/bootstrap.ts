import { join } from "node:path";
import { Runner } from "@core/engine/runner";
import { RateLimiter } from "@core/limits/rateLimiter";
import { UploadBudget } from "@core/limits/uploadBudget";
import { loadActions } from "@core/registry/actionRegistry";
import { BotSecrets } from "@core/storage/botSecrets";
import { readJson, writeJson } from "@core/storage/jsonStore";

import type { AppDefinition } from "@core/interfaces/appTypes";
import type { RunnerConfig } from "@core/interfaces/configTypes";
import type { UploadEntry } from "@core/interfaces/limitTypes";
import type { PersistedRunnerState } from "@core/interfaces/runnerTypes";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_STATE: PersistedRunnerState = { running: false, disabledBots: [], disabledActions: [] };

/** Wires an app's runner: its actions, its persisted state, and the runner-wide caps. */
export async function createRunner<TPersona>(
  config: RunnerConfig,
  app: AppDefinition<TPersona>,
): Promise<Runner<TPersona>> {
  const stateFile = { path: join(config.stateDir, `${app.id}-state.json`) };
  const uploadsFile = { path: join(config.stateDir, "uploads.json") };
  return new Runner<TPersona>({
    app,
    actions: await loadActions<TPersona>(app.actionsDir),
    limits: config.limits,
    limiter: new RateLimiter(config.limits.maxRps),
    uploads: new UploadBudget({
      budgetBytes: config.limits.uploadBudgetBytes,
      windowMs: config.limits.uploadWindowDays * DAY_MS,
      entries: await readJson<UploadEntry[]>(uploadsFile, []),
      onChange: (entries) => void writeJson(uploadsFile, entries),
    }),
    secrets: await BotSecrets.load(join(config.stateDir, "bot-secrets.json")),
    initialState: { ...DEFAULT_STATE, ...(await readJson<Partial<PersistedRunnerState>>(stateFile, {})) },
    saveState: (state) => writeJson(stateFile, state),
  });
}
