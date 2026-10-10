import { BOT_STATE } from "@core/constants/bot";
import { BotBlockedError, SessionExpiredError } from "@core/engine/errors";
import { actionsPerWake, nextWakeAt, thinkTimeMs } from "@core/engine/schedule";
import { assertSyntheticEmail } from "@core/guards/syntheticEmail";
import { AppClient } from "@core/http/appClient";
import { logger } from "@core/log/logger";
import { Rng } from "@core/random/rng";

import type { ActionContext, ActionSnapshot, BotAction, BotMemory } from "@core/interfaces/actionTypes";
import type { BotProfile, BotSnapshot, BotState } from "@core/interfaces/botTypes";
import type { PersistedRunnerState, RunnerDeps, RunnerStatus, WakeOptions } from "@core/interfaces/runnerTypes";

const TICK_MS = 5_000;
const MINUTE_MS = 60_000;

interface BotRuntime<TPersona> {
  profile: BotProfile<TPersona>;
  client: AppClient;
  rng: Rng;
  memory: BotMemory;
  state: BotState;
  signedIn: boolean;
  busy: boolean;
  currentAction: string | null;
  totalActions: number;
  errors: number;
  lastSeenAt: Date | null;
  nextWakeAt: Date | null;
}

interface ActionStats {
  runs: number;
  errors: number;
}

/**
 * Runs one app's bots. Off by default: nothing happens until `start()` — and the kill switch is
 * persisted, so a restart never wakes bots that were stopped. Every bot email is checked against
 * the app's synthetic domain, and the bot count against the hard cap, before anything else.
 */
export class Runner<TPersona = unknown> {
  private readonly bots = new Map<string, BotRuntime<TPersona>>();
  private readonly actionStats = new Map<string, ActionStats>();
  private readonly state: PersistedRunnerState;
  private readonly recentActions: number[] = [];
  private readonly recentErrors: number[] = [];
  private readonly recentRequests: number[] = [];
  private ticker: NodeJS.Timeout | undefined;

  constructor(private readonly deps: RunnerDeps<TPersona>) {
    const { app, limits } = deps;
    if (app.bots.length > limits.maxBots) {
      throw new Error(`${app.bots.length} bots configured, above the hard cap of ${limits.maxBots}`);
    }
    for (const profile of app.bots) {
      assertSyntheticEmail(profile.email, app.syntheticDomain);
      this.bots.set(profile.id, this.createRuntime(profile));
    }
    for (const action of deps.actions) {
      this.actionStats.set(action.name, { runs: 0, errors: 0 });
    }
    this.state = { ...deps.initialState };
  }

  /** Resumes where the last process left off: running only if it was running. */
  resume(): void {
    if (this.state.running) {
      this.startTicker();
    }
  }

  async start(): Promise<void> {
    this.state.running = true;
    await this.deps.saveState(this.state);
    this.startTicker();
    logger.info("runner started", { app: this.deps.app.id });
  }

  /** The kill switch: no new visit starts, and visits in progress stop after their current action. */
  async stop(): Promise<void> {
    this.state.running = false;
    await this.deps.saveState(this.state);
    clearInterval(this.ticker);
    this.ticker = undefined;
    for (const bot of this.bots.values()) {
      bot.nextWakeAt = null;
    }
    logger.info("runner stopped", { app: this.deps.app.id });
  }

  isRunning(): boolean {
    return this.state.running;
  }

  async setBotEnabled(botId: string, enabled: boolean): Promise<boolean> {
    if (!this.bots.has(botId)) {
      return false;
    }
    this.state.disabledBots = toggle(this.state.disabledBots, botId, enabled);
    await this.deps.saveState(this.state);
    return true;
  }

  async setActionEnabled(name: string, enabled: boolean): Promise<boolean> {
    if (!this.actionStats.has(name)) {
      return false;
    }
    this.state.disabledActions = toggle(this.state.disabledActions, name, enabled);
    await this.deps.saveState(this.state);
    return true;
  }

  recordRequest(): void {
    this.recentRequests.push(Date.now());
  }

  /**
   * One visit of one bot: sign in if needed, then a few actions picked at random among those that
   * can run. Used by the scheduler and by the CLI (`pnpm bot:once`).
   */
  async runWake(botId: string, options: WakeOptions = {}): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot || bot.busy || bot.state === BOT_STATE.blocked) {
      return;
    }
    bot.busy = true;
    bot.state = BOT_STATE.active;
    const count = options.actions ?? actionsPerWake(bot.rng);
    try {
      for (let i = 0; i < count; i++) {
        // The kill switch holds mid-visit too: the visit ends after the action in progress.
        if (!this.state.running && !options.force) {
          break;
        }
        if (i > 0) {
          await sleep(options.thinkTimeMs ?? thinkTimeMs(bot.rng));
        }
        await this.ensureSignedIn(bot);
        await this.runOneAction(bot);
      }
    } catch (error) {
      if (error instanceof BotBlockedError) {
        bot.state = BOT_STATE.blocked;
        logger.error("bot blocked", { bot: bot.profile.id, reason: error.message });
      } else {
        logger.error("visit failed", { bot: bot.profile.id, error: String(error) });
      }
    } finally {
      bot.busy = false;
      bot.currentAction = null;
      bot.lastSeenAt = new Date();
      if (bot.state !== BOT_STATE.blocked) {
        bot.state = BOT_STATE.sleeping;
      }
    }
  }

  status(): RunnerStatus {
    const now = Date.now();
    const counts: Record<string, number> = {};
    for (const bot of this.snapshotBots()) {
      counts[bot.state] = (counts[bot.state] ?? 0) + 1;
    }
    return {
      app: this.deps.app.id,
      running: this.state.running,
      bots: counts,
      actionsPerMin: countSince(this.recentActions, now - MINUTE_MS),
      errorsPerMin: countSince(this.recentErrors, now - MINUTE_MS),
      requestsPerMin: countSince(this.recentRequests, now - MINUTE_MS),
      limits: this.deps.limits,
      uploadBudget: this.deps.uploads.snapshot(),
    };
  }

  snapshotBots(): BotSnapshot[] {
    return [...this.bots.values()].map((bot) => ({
      id: bot.profile.id,
      email: bot.profile.email,
      kind: bot.profile.kind,
      state: this.effectiveState(bot),
      enabled: !this.state.disabledBots.includes(bot.profile.id),
      currentAction: bot.currentAction,
      totalActions: bot.totalActions,
      errors: bot.errors,
      uploads: Number(bot.memory.get("uploads") ?? 0),
      lastSeenAt: bot.lastSeenAt?.toISOString() ?? null,
      nextWakeAt: bot.nextWakeAt?.toISOString() ?? null,
    }));
  }

  snapshotActions(): ActionSnapshot[] {
    return this.deps.actions.map((action) => {
      const stats = this.actionStats.get(action.name) ?? { runs: 0, errors: 0 };
      return {
        name: action.name,
        description: action.description,
        weight: action.weight,
        enabled: !this.state.disabledActions.includes(action.name),
        runs: stats.runs,
        errors: stats.errors,
      };
    });
  }

  private createRuntime(profile: BotProfile<TPersona>): BotRuntime<TPersona> {
    return {
      profile,
      client: new AppClient({
        baseUrl: this.deps.app.baseUrl,
        throttle: () => this.deps.limiter.acquire(),
        onRequest: () => this.recordRequest(),
      }),
      rng: new Rng(`${this.deps.app.id}:${profile.id}`),
      memory: new Map(),
      state: BOT_STATE.sleeping,
      signedIn: false,
      busy: false,
      currentAction: null,
      totalActions: 0,
      errors: 0,
      lastSeenAt: null,
      nextWakeAt: null,
    };
  }

  private effectiveState(bot: BotRuntime<TPersona>): BotState {
    if (bot.state === BOT_STATE.blocked || bot.state === BOT_STATE.active) {
      return bot.state;
    }
    if (!this.state.running) {
      return BOT_STATE.stopped;
    }
    if (this.state.disabledBots.includes(bot.profile.id)) {
      return BOT_STATE.paused;
    }
    return bot.state;
  }

  private startTicker(): void {
    if (this.ticker) {
      return;
    }
    this.tick();
    this.ticker = setInterval(() => this.tick(), TICK_MS);
  }

  /** Wakes every bot whose time has come; plans the first wake of the others. */
  private tick(): void {
    const now = new Date();
    for (const bot of this.bots.values()) {
      if (!this.state.running || bot.busy || this.effectiveState(bot) !== BOT_STATE.sleeping) {
        continue;
      }
      if (!bot.nextWakeAt) {
        bot.nextWakeAt = nextWakeAt(now, bot.rng);
        continue;
      }
      if (bot.nextWakeAt <= now) {
        bot.nextWakeAt = nextWakeAt(now, bot.rng);
        void this.runWake(bot.profile.id);
      }
    }
  }

  private async ensureSignedIn(bot: BotRuntime<TPersona>): Promise<void> {
    if (bot.signedIn) {
      return;
    }
    // Checked again here, right before the password leaves the runner.
    assertSyntheticEmail(bot.profile.email, this.deps.app.syntheticDomain);
    const password = await this.deps.secrets.passwordFor(bot.profile.email);
    bot.client.reset();
    await this.deps.app.authenticate({ bot: bot.profile, client: bot.client, password });
    bot.signedIn = true;
  }

  private async runOneAction(bot: BotRuntime<TPersona>): Promise<void> {
    const ctx: ActionContext<TPersona> = {
      bot: bot.profile,
      client: bot.client,
      rng: bot.rng,
      memory: bot.memory,
      uploads: this.deps.uploads,
      now: () => new Date(),
    };
    const candidates = this.deps.actions.filter(
      (action) => !this.state.disabledActions.includes(action.name) && (action.canRun?.(ctx) ?? true),
    );
    const action = bot.rng.weighted(candidates, (candidate: BotAction<TPersona>) => candidate.weight);
    if (!action) {
      return;
    }
    const stats = this.actionStats.get(action.name);
    bot.currentAction = action.name;
    const started = Date.now();
    try {
      await action.run(ctx);
      bot.totalActions += 1;
      if (stats) stats.runs += 1;
      this.recentActions.push(Date.now());
      logger.info("action", { bot: bot.profile.id, action: action.name, ms: Date.now() - started });
    } catch (error) {
      bot.errors += 1;
      if (stats) stats.errors += 1;
      this.recentErrors.push(Date.now());
      if (error instanceof SessionExpiredError) {
        bot.signedIn = false;
      }
      if (error instanceof BotBlockedError) {
        throw error;
      }
      logger.warn("action failed", { bot: bot.profile.id, action: action.name, error: String(error) });
    } finally {
      bot.currentAction = null;
      trimBefore(this.recentActions, Date.now() - MINUTE_MS);
      trimBefore(this.recentErrors, Date.now() - MINUTE_MS);
      trimBefore(this.recentRequests, Date.now() - MINUTE_MS);
    }
  }
}

function toggle(list: string[], id: string, enabled: boolean): string[] {
  const without = list.filter((item) => item !== id);
  return enabled ? without : [...without, id];
}

function countSince(timestamps: number[], since: number): number {
  return timestamps.filter((t) => t >= since).length;
}

function trimBefore(timestamps: number[], cutoff: number): void {
  while (timestamps.length > 0 && (timestamps[0] ?? 0) < cutoff) {
    timestamps.shift();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
