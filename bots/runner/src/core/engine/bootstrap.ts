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
import type { DayActivity } from "@core/interfaces/metricsTypes";
import type { PersistedRunnerState } from "@core/interfaces/runnerTypes";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_STATE: PersistedRunnerState = { disabledBots: [], disabledActions: [] };

/** A state file written before PFA-202, when one kill switch stopped every bot. */
interface LegacyRunnerState {
  running?: boolean;
}

/** Wires an app's runner: its actions, its persisted state, and the runner-wide caps. */
export async function createRunner<TPersona>(
  config: RunnerConfig,
  app: AppDefinition<TPersona>,
): Promise<Runner<TPersona>> {
  const stateFile = { path: join(config.stateDir, `${app.id}-state.json`) };
  const uploadsFile = { path: join(config.stateDir, "uploads.json") };
  const activityFile = { path: join(config.stateDir, `${app.id}-activity.json`) };
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
    initialState: migrateState(await readJson<Partial<PersistedRunnerState> & LegacyRunnerState>(stateFile, {})),
    saveState: (state) => writeJson(stateFile, state),
    initialActivity: await readJson<DayActivity | undefined>(activityFile, undefined),
    saveActivity: (activity) => writeJson(activityFile, activity),
  });
}

/** The old kill switch becomes the "Daily bots" switch: the load bots always had their own. */
function migrateState(saved: Partial<PersistedRunnerState> & LegacyRunnerState): PersistedRunnerState {
  const { running, ...state } = saved;
  return { ...DEFAULT_STATE, ...state, dailyEnabled: state.dailyEnabled ?? running === true };
}
