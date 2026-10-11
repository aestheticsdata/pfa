import { BOT_KIND, BOT_STATE, LOAD_PACE } from "@core/constants/bot";
import { BotBlockedError, SessionExpiredError } from "@core/engine/errors";
import { planRamp } from "@core/engine/ramp";
import {
  actionsPerWake,
  burstThinkTimeMs,
  burstWakeAt,
  firstVisitDelayMs,
  nextWakeAt,
  thinkTimeMs,
} from "@core/engine/schedule";
import { assertSyntheticEmail } from "@core/guards/syntheticEmail";
import { AppClient } from "@core/http/appClient";
import { logger } from "@core/log/logger";
import { percentile, TimeBuckets } from "@core/metrics/timeBuckets";
import { Rng } from "@core/random/rng";
import { isQuietTime, nextQuietChange } from "@core/time/quietHours";

import type { ActionContext, ActionSnapshot, BotAction, BotMemory } from "@core/interfaces/actionTypes";
import type {
  BotDetail,
  BotProfile,
  BotSnapshot,
  BotState,
  BotToggle,
  BulkResult,
  LoadPace,
} from "@core/interfaces/botTypes";
import type { RequestRecord } from "@core/interfaces/httpTypes";
import type {
  ActivityBucket,
  ActivityPoint,
  BotActivityBucket,
  DayActivity,
  RecentRequest,
} from "@core/interfaces/metricsTypes";
import type {
  PersistedRunnerState,
  RampSettings,
  RunnerDeps,
  RunnerStatus,
  WakeOptions,
} from "@core/interfaces/runnerTypes";
import type { QuietHours, QuietHoursSnapshot } from "@core/interfaces/timeTypes";

/** One second: the ramp's interval can be as short as that. */
const TICK_MS = 1_000;
const MINUTE_MS = 60_000;
/** The back-office's charts: the runner's last 80 s in 1-second slices, each bot's last 30 s in 2-second ones. */
const RUNNER_SLICE_MS = 1_000;
const RUNNER_SLICES = 80;
const BOT_SLICE_MS = 2_000;
const BOT_SLICES = 15;
/**
 * The day charts, saved at most once a minute: the runner's last 24 h in 15-minute slices (PFA-206),
 * each bot's in 1-hour ones (its sparkline, PFA-204).
 */
const HOUR_MS = 60 * MINUTE_MS;
const DAY_SLICES = 24;
const QUARTER_MS = 15 * MINUTE_MS;
const DAY_QUARTERS = 96;
const ACTIVITY_SAVE_MS = MINUTE_MS;
/** Response times kept per hour for its p50/p95: past that, a sample replaces a random one. */
const DAY_LATENCY_SAMPLES = 2_000;
const RECENT_REQUESTS = 14;
const RPS_WINDOW_MS = 10_000;
const DEFAULT_RAMP: RampSettings = { step: 10, everySec: 30 };
/**
 * Backpressure: at most this many visits at once, every bot together. A bot whose time has come
 * while the pool is full waits for the next tick, so 500 bots never open 500 visits in one second
 * — the generator must not fall over before the server it is testing.
 */
const MAX_ACTIVE_VISITS = 50;

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
  sessionStartedAt: Date | null;
  activity: TimeBuckets<BotActivityBucket>;
  day: TimeBuckets<BotActivityBucket>;
  byAction: Map<string, number>;
  recentRequests: RecentRequest[];
}

interface ActionStats {
  runs: number;
  errors: number;
}

/** An action about to be picked, and what the visit already did. */
interface VisitCheck<TPersona> {
  action: BotAction<TPersona>;
  visit: Map<string, number>;
}

/**
 * Runs one app's bots. Off by default: nothing happens until the "Daily bots" or the "Load bots"
 * switch is on — both persisted, so a restart never wakes bots that were stopped. Every bot email is
 * checked against the app's synthetic domain, and the bot count against the hard cap, before anything else.
 */
export class Runner<TPersona = unknown> {
  private readonly bots = new Map<string, BotRuntime<TPersona>>();
  private readonly actionStats = new Map<string, ActionStats>();
  private readonly state: PersistedRunnerState;
  private readonly recentActions: number[] = [];
  private readonly recentErrors: number[] = [];
  private readonly recentRequests: number[] = [];
  /** Load bots the ramp has brought up, and their ramp order (the first `maxBots` of the app's). */
  private readonly spawned = new Set<string>();
  private readonly loadOrder: string[] = [];
  private lastStepAt = 0;
  private activeVisits = 0;
  private readonly activity = new TimeBuckets<ActivityBucket>({
    bucketMs: RUNNER_SLICE_MS,
    size: RUNNER_SLICES,
    make: () => this.emptyActivity(),
  });
  private readonly day = new TimeBuckets<ActivityBucket>({
    bucketMs: QUARTER_MS,
    size: DAY_QUARTERS,
    make: () => this.emptyActivity(),
  });
  private dayDirty = false;
  private daySavedAt = 0;
  private readonly seed: string;
  private ticker: NodeJS.Timeout | undefined;

  constructor(private readonly deps: RunnerDeps<TPersona>) {
    const { app, limits } = deps;
    this.seed = deps.seed ?? String(Date.now());
    if (app.bots.length > limits.maxBots) {
      throw new Error(`${app.bots.length} bots configured, above the hard cap of ${limits.maxBots}`);
    }
    for (const profile of [...app.bots, ...(app.loadBots ?? []).slice(0, limits.maxBots)]) {
      assertSyntheticEmail(profile.email, app.syntheticDomain);
      if (this.bots.has(profile.id)) {
        throw new Error(`Two bots share the id "${profile.id}"`);
      }
      this.bots.set(profile.id, this.createRuntime(profile));
      if (profile.kind === BOT_KIND.load) this.loadOrder.push(profile.id);
    }
    for (const action of deps.actions) {
      this.actionStats.set(action.name, { runs: 0, errors: 0 });
    }
    // Load bots have no switch of their own (PFA-203): only the "Load bots" switch and the target.
    this.state = {
      ...deps.initialState,
      disabledBots: deps.initialState.disabledBots.filter((id) => this.bots.get(id)?.profile.kind !== BOT_KIND.load),
    };
    // A file written before PFA-205 holds actions and errors only: the rest starts at zero. Its
    // 1-hour slices land in the first quarter of their hour.
    this.day.restore(
      (deps.initialActivity?.runner ?? []).map(({ at, bucket }) => ({
        at,
        bucket: { ...this.emptyActivity(), ...bucket },
      })),
    );
    for (const [id, slices] of Object.entries(deps.initialActivity?.bots ?? {})) {
      this.bots.get(id)?.day.restore(slices);
    }
    for (const id of this.state.blockedBots ?? []) {
      const bot = this.bots.get(id);
      if (bot) bot.state = BOT_STATE.blocked;
    }
  }

  /** Resumes where the last process left off: running only if one of the two switches was on. */
  resume(): void {
    this.syncTicker();
  }

  /** Something runs: the daily bots, the load bots, or both. */
  isRunning(): boolean {
    return this.dailyEnabled() || this.loadEnabled();
  }

  /**
   * The "Daily bots" switch: off, no daily bot starts a visit and those in progress stop after
   * their current action. The load bots are not touched — they have their own switch.
   */
  async setDailyEnabled(enabled: boolean): Promise<boolean> {
    this.state.dailyEnabled = enabled;
    await this.deps.saveState(this.state);
    for (const bot of this.bots.values()) {
      if (bot.profile.kind === BOT_KIND.daily) bot.nextWakeAt = null;
    }
    this.syncTicker();
    logger.info(enabled ? "daily bots on" : "daily bots off", { app: this.deps.app.id });
    return enabled;
  }

  async setBotEnabled(botId: string, enabled: boolean): Promise<boolean> {
    const { updated } = await this.setBotsEnabled({ ids: [botId], enabled });
    return updated.length === 1;
  }

  /**
   * One write for the whole selection (the back-office's bulk on/off). Daily bots only: a load bot
   * runs when the "Load bots" switch and the target say so, nothing else. Unknown ids are reported.
   */
  async setBotsEnabled(toggle: BotToggle): Promise<BulkResult> {
    const updated = toggle.ids.filter((id) => this.bots.get(id)?.profile.kind === BOT_KIND.daily);
    const unknown = toggle.ids.filter((id) => !this.bots.has(id));
    let disabled = this.state.disabledBots;
    for (const id of updated) {
      disabled = toggleIn(disabled, id, toggle.enabled);
    }
    this.state.disabledBots = disabled;
    if (updated.length > 0) {
      await this.deps.saveState(this.state);
    }
    return { updated, unknown };
  }

  async setActionEnabled(name: string, enabled: boolean): Promise<boolean> {
    if (!this.actionStats.has(name)) {
      return false;
    }
    this.state.disabledActions = toggleIn(this.state.disabledActions, name, enabled);
    await this.deps.saveState(this.state);
    return true;
  }

  async enableAllActions(): Promise<void> {
    this.state.disabledActions = [];
    await this.deps.saveState(this.state);
  }

  /**
   * The load-bot target, clamped to the hard cap. The ramp gets there on its own: up `step` at a
   * time, down at once (the excess stops after its current action). Daily bots are never counted.
   */
  async setTarget(target: number): Promise<number> {
    this.state.target = Math.max(0, Math.min(this.deps.limits.maxBots, Math.floor(target)));
    await this.deps.saveState(this.state);
    this.rampNow();
    return this.state.target;
  }

  /**
   * The "Load bots" switch: off stops every load bot at once and keeps the target; on brings the
   * target back up through the ramp. Daily bots are not touched — they have their own switch.
   */
  async setLoadEnabled(enabled: boolean): Promise<boolean> {
    this.state.loadEnabled = enabled;
    await this.deps.saveState(this.state);
    // Back on: the first step comes up now, the rest at the ramp's pace.
    if (enabled) this.lastStepAt = 0;
    this.rampNow();
    this.syncTicker();
    logger.info(enabled ? "load bots on" : "load bots off", { app: this.deps.app.id, target: this.state.target ?? 0 });
    return enabled;
  }

  /** Changes how the load bots behave; the ones already up take the new pace from their next visit. */
  async setLoadPace(pace: LoadPace): Promise<LoadPace> {
    this.state.loadPace = pace;
    await this.deps.saveState(this.state);
    const now = Date.now();
    for (const id of this.spawned) {
      const bot = this.bots.get(id);
      if (bot && !bot.busy) bot.nextWakeAt = new Date(now + firstVisitDelayMs(bot.rng, this.isBurst()));
    }
    return pace;
  }

  async setRamp(ramp: RampSettings): Promise<RampSettings> {
    this.state.ramp = {
      step: Math.max(1, Math.min(this.deps.limits.maxBots, Math.floor(ramp.step))),
      everySec: Math.max(1, Math.floor(ramp.everySec)),
    };
    await this.deps.saveState(this.state);
    return this.state.ramp;
  }

  quietHours(): QuietHoursSnapshot {
    const hours = this.state.quietHours ?? this.deps.app.defaultQuietHours;
    const { timeZone } = this.deps.app;
    const now = new Date();
    return {
      from: hours.from,
      to: hours.to,
      tz: timeZone,
      active: isQuietTime(now, hours, timeZone),
      nextChangeAt: nextQuietChange(now, hours, timeZone).toISOString(),
    };
  }

  /** Validated by the caller (`isValidQuietHours`); takes effect on the next action picked. */
  async setQuietHours(hours: QuietHours): Promise<QuietHoursSnapshot> {
    this.state.quietHours = { from: hours.from, to: hours.to };
    await this.deps.saveState(this.state);
    return this.quietHours();
  }

  /** Forgets the bot's session: its next visit signs in afresh. */
  restartSession(botId: string): boolean {
    const bot = this.bots.get(botId);
    if (!bot) {
      return false;
    }
    bot.signedIn = false;
    bot.sessionStartedAt = null;
    bot.client.reset();
    bot.recentRequests = [];
    return true;
  }

  /**
   * "Disable / purge account" from the back-office: the app does it, then the bot is blocked for
   * good — persisted, so a restart never signs a disabled bot back in, nor re-creates a purged one.
   * `false` when the bot is unknown; throws when the app has no account admin or refuses.
   */
  async closeAccount(botId: string, purge: boolean): Promise<boolean> {
    const bot = this.bots.get(botId);
    if (!bot) {
      return false;
    }
    const admin = this.deps.app.accounts;
    if (!admin) {
      throw new Error(`${this.deps.app.name} cannot disable or purge accounts`);
    }
    assertSyntheticEmail(bot.profile.email, this.deps.app.syntheticDomain);
    await (purge ? admin.purge(bot.profile) : admin.disable(bot.profile));
    bot.state = BOT_STATE.blocked;
    bot.signedIn = false;
    bot.sessionStartedAt = null;
    bot.client.reset();
    bot.nextWakeAt = null;
    this.state.blockedBots = [...new Set([...(this.state.blockedBots ?? []), botId])];
    await this.deps.saveState(this.state);
    logger.warn(purge ? "account purged" : "account disabled", { app: this.deps.app.id, bot: botId });
    return true;
  }

  recordRequest(record: RequestRecord): void {
    this.recentRequests.push(Date.now());
    const throttled = this.deps.limiter.throttledWithin(RUNNER_SLICE_MS);
    for (const slice of [this.activity.current(), this.day.current()]) {
      slice.requests += 1;
      if (slice.latencies.length < DAY_LATENCY_SAMPLES) slice.latencies.push(record.ms);
      else slice.latencies[Math.floor(Math.random() * DAY_LATENCY_SAMPLES)] = record.ms;
      if (record.status >= 500 || record.status === 0) slice.codes5xx += 1;
      else if (record.status >= 400) slice.codes4xx += 1;
      else slice.codes2xx += 1;
      if (throttled) slice.throttled = true;
    }
    this.dayDirty = true;
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
    this.activeVisits += 1;
    bot.state = BOT_STATE.active;
    const count = options.actions ?? actionsPerWake(bot.rng);
    // How many times each action ran in this visit, for `maxPerVisit`.
    const visit = new Map<string, number>();
    try {
      for (let i = 0; i < count; i++) {
        // The bot's switches — and, for a load bot, the ramp taking it down — hold mid-visit too:
        // the visit ends after the action in progress.
        if (!options.force && !this.mayVisit(bot)) {
          break;
        }
        if (i > 0) {
          await sleep(options.thinkTimeMs ?? this.thinkTime(bot));
        }
        await this.ensureSignedIn(bot);
        await this.runOneAction(bot, visit);
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
      this.activeVisits -= 1;
      bot.currentAction = null;
      bot.lastSeenAt = new Date();
      if (bot.state !== BOT_STATE.blocked) {
        bot.state = BOT_STATE.sleeping;
      }
    }
  }

  status(): RunnerStatus {
    const now = Date.now();
    const snapshots = this.snapshotBots();
    const counts: Record<string, number> = {};
    for (const bot of snapshots) {
      counts[bot.state] = (counts[bot.state] ?? 0) + 1;
    }
    const isLive = (bot: BotSnapshot) => bot.state === BOT_STATE.active || bot.state === BOT_STATE.sleeping;
    const daily = snapshots.filter((bot) => bot.kind === BOT_KIND.daily);
    const load = snapshots.filter((bot) => bot.kind === BOT_KIND.load);
    return {
      app: this.deps.app.id,
      running: this.isRunning(),
      dailyEnabled: this.dailyEnabled(),
      bots: counts,
      liveDaily: daily.filter(isLive).length,
      totalDaily: daily.length,
      liveLoad: load.filter(isLive).length,
      totalLoad: load.length,
      target: this.state.target ?? 0,
      spawned: this.spawned.size,
      ramp: this.ramp(),
      loadEnabled: this.loadEnabled(),
      loadPace: this.state.loadPace ?? LOAD_PACE.daily,
      nextStepInSec: this.nextStepInSec(now),
      activeVisits: this.activeVisits,
      maxActiveVisits: MAX_ACTIVE_VISITS,
      actionsPerMin: countSince(this.recentActions, now - MINUTE_MS),
      errorsPerMin: countSince(this.recentErrors, now - MINUTE_MS),
      requestsPerMin: countSince(this.recentRequests, now - MINUTE_MS),
      rps: countSince(this.recentRequests, now - RPS_WINDOW_MS) / (RPS_WINDOW_MS / 1000),
      throttled: this.deps.limiter.throttledWithin(RPS_WINDOW_MS),
      limits: this.deps.limits,
      uploadBudget: this.deps.uploads.snapshot(),
      quietHours: this.quietHours(),
    };
  }

  /** The last 24 h in 15-minute slices, oldest first: the back-office's day charts (PFA-204/205/206). */
  dayHistory(): ActivityPoint[] {
    return this.points(this.day);
  }

  /** The last 80 s in 1-second slices, oldest first: the back-office's live charts. */
  history(): ActivityPoint[] {
    return this.points(this.activity);
  }

  private points(window: TimeBuckets<ActivityBucket>): ActivityPoint[] {
    const live = this.status();
    const latest = window.current();
    latest.live = live.liveDaily + live.liveLoad;
    latest.target = live.totalDaily + this.effectiveTarget();
    return window.read().map(({ at, bucket }) => ({
      at: new Date(at).toISOString(),
      actions: bucket.actions,
      errors: bucket.errors,
      byAction: { ...bucket.byAction },
      requests: bucket.requests,
      p50: percentile(bucket.latencies, 0.5),
      p95: percentile(bucket.latencies, 0.95),
      codes2xx: bucket.codes2xx,
      codes4xx: bucket.codes4xx,
      codes5xx: bucket.codes5xx,
      live: bucket.live,
      target: bucket.target,
      throttled: bucket.throttled,
    }));
  }

  snapshotBots(): BotSnapshot[] {
    return [...this.bots.values()].map((bot) => this.snapshotOf(bot));
  }

  detail(botId: string): BotDetail | null {
    const bot = this.bots.get(botId);
    if (!bot) {
      return null;
    }
    return {
      ...this.snapshotOf(bot),
      byAction: Object.fromEntries(bot.byAction),
      recentRequests: bot.recentRequests,
    };
  }

  snapshotActions(): ActionSnapshot[] {
    return this.deps.actions.map((action) => {
      const stats = this.actionStats.get(action.name) ?? { runs: 0, errors: 0 };
      return {
        name: action.name,
        description: action.description,
        weight: action.weight,
        enabled: !this.state.disabledActions.includes(action.name),
        pausedInQuietHours: action.pausedInQuietHours === true,
        usesUploadBudget: action.usesUploadBudget === true,
        runs: stats.runs,
        errors: stats.errors,
      };
    });
  }

  private snapshotOf(bot: BotRuntime<TPersona>): BotSnapshot {
    const spark = bot.activity.read().map(({ bucket }) => ({ ...bucket }));
    const lastMinute = spark.reduce((sum, slice) => sum + slice.actions, 0) * (MINUTE_MS / (BOT_SLICES * BOT_SLICE_MS));
    const attempts = bot.totalActions + bot.errors;
    return {
      id: bot.profile.id,
      email: bot.profile.email,
      kind: bot.profile.kind,
      state: this.effectiveState(bot),
      // A load bot's "on" is read-only: the ramp has it up.
      enabled:
        bot.profile.kind === BOT_KIND.load
          ? this.spawned.has(bot.profile.id)
          : !this.state.disabledBots.includes(bot.profile.id),
      currentAction: bot.currentAction,
      totalActions: bot.totalActions,
      errors: bot.errors,
      uploads: Number(bot.memory.get("uploads") ?? 0),
      actionsPerMin: lastMinute,
      errorRate: attempts === 0 ? 0 : bot.errors / attempts,
      spark,
      daySpark: bot.day.read().map(({ bucket }) => ({ ...bucket })),
      sessionStartedAt: bot.sessionStartedAt?.toISOString() ?? null,
      lastSeenAt: bot.lastSeenAt?.toISOString() ?? null,
      nextWakeAt: bot.nextWakeAt?.toISOString() ?? null,
    };
  }

  private createRuntime(profile: BotProfile<TPersona>): BotRuntime<TPersona> {
    const runtime: BotRuntime<TPersona> = {
      profile,
      client: new AppClient({
        baseUrl: this.deps.app.baseUrl,
        throttle: () => this.deps.limiter.acquire(),
        onRequest: (record) => {
          this.recordRequest(record);
          runtime.recentRequests = [{ at: new Date().toISOString(), ...record }, ...runtime.recentRequests].slice(
            0,
            RECENT_REQUESTS,
          );
        },
      }),
      rng: new Rng(`${this.deps.app.id}:${profile.id}:${this.seed}`),
      memory: new Map(),
      state: BOT_STATE.sleeping,
      signedIn: false,
      busy: false,
      currentAction: null,
      totalActions: 0,
      errors: 0,
      lastSeenAt: null,
      nextWakeAt: null,
      sessionStartedAt: null,
      activity: new TimeBuckets<BotActivityBucket>({
        bucketMs: BOT_SLICE_MS,
        size: BOT_SLICES,
        make: () => ({ actions: 0, errors: 0 }),
      }),
      day: new TimeBuckets<BotActivityBucket>({
        bucketMs: HOUR_MS,
        size: DAY_SLICES,
        make: () => ({ actions: 0, errors: 0 }),
      }),
      byAction: new Map(),
      recentRequests: [],
    };
    return runtime;
  }

  private emptyActivity(): ActivityBucket {
    // Sampled when the slice opens, so the population line has a value for every slice.
    let live = 0;
    let daily = 0;
    for (const bot of this.bots?.values() ?? []) {
      const state = this.effectiveState(bot);
      if (state === BOT_STATE.active || state === BOT_STATE.sleeping) live += 1;
      if (bot.profile.kind === BOT_KIND.daily) daily += 1;
    }
    return {
      actions: 0,
      errors: 0,
      byAction: {},
      requests: 0,
      latencies: [],
      codes2xx: 0,
      codes4xx: 0,
      codes5xx: 0,
      live,
      target: daily + (this.state ? this.effectiveTarget() : 0),
      throttled: false,
    };
  }

  private effectiveState(bot: BotRuntime<TPersona>): BotState {
    if (bot.state === BOT_STATE.blocked || bot.state === BOT_STATE.active) {
      return bot.state;
    }
    if (!this.kindEnabled(bot)) {
      return BOT_STATE.stopped;
    }
    if (this.state.disabledBots.includes(bot.profile.id)) {
      return BOT_STATE.paused;
    }
    if (bot.profile.kind === BOT_KIND.load && !this.spawned.has(bot.profile.id)) {
      return BOT_STATE.queued;
    }
    return bot.state;
  }

  /** Ticks while either switch is on; with both off, the load bots come up again through the ramp. */
  private syncTicker(): void {
    if (!this.isRunning()) {
      clearInterval(this.ticker);
      this.ticker = undefined;
      this.lastStepAt = 0;
      return;
    }
    if (this.ticker) {
      return;
    }
    this.tick();
    this.ticker = setInterval(() => this.tick(), TICK_MS);
  }

  /**
   * Moves the ramp one decision forward, then wakes every bot whose time has come — as many as the
   * visit pool allows; the others stay due and go at the next tick. Plans the first wake of the rest.
   */
  private tick(): void {
    if (!this.isRunning()) {
      return;
    }
    this.rampNow();
    this.saveDayIfDue();
    const now = new Date();
    for (const bot of this.bots.values()) {
      if (bot.busy || this.effectiveState(bot) !== BOT_STATE.sleeping) {
        continue;
      }
      if (!bot.nextWakeAt) {
        bot.nextWakeAt = this.nextVisit(bot, now);
        continue;
      }
      if (bot.nextWakeAt <= now && this.activeVisits < MAX_ACTIVE_VISITS) {
        bot.nextWakeAt = this.nextVisit(bot, now);
        void this.runWake(bot.profile.id);
      }
    }
  }

  /** One ramp decision, applied: who comes up (first visit soon, spread out) and who stops. */
  private rampNow(): void {
    const now = Date.now();
    const ramp = this.ramp();
    const stepDue = now - this.lastStepAt >= ramp.everySec * 1000;
    const plan = planRamp({
      order: this.loadOrder.filter((id) => this.bots.get(id)?.state !== BOT_STATE.blocked),
      spawned: this.spawned,
      target: this.state.target ?? 0,
      enabled: this.loadEnabled(),
      stepDue,
      step: ramp.step,
    });
    for (const id of plan.despawn) {
      this.spawned.delete(id);
      const bot = this.bots.get(id);
      if (bot) bot.nextWakeAt = null;
    }
    for (const id of plan.spawn) {
      this.spawned.add(id);
      const bot = this.bots.get(id);
      if (bot) bot.nextWakeAt = new Date(now + firstVisitDelayMs(bot.rng, this.isBurst()));
    }
    if (plan.spawn.length > 0) {
      this.lastStepAt = now;
      logger.info("ramp step", { app: this.deps.app.id, up: this.spawned.size, target: this.state.target ?? 0 });
    }
  }

  /** Seconds until the ramp's next step, while load bots are still on their way up; null otherwise. */
  private nextStepInSec(now: number): number | null {
    if (!this.loadEnabled() || this.spawned.size >= (this.state.target ?? 0)) {
      return null;
    }
    const left = this.lastStepAt + this.ramp().everySec * 1000 - now;
    return Math.max(0, Math.ceil(left / 1000));
  }

  /** May this bot (go on) visit now: its switches are on and, for a load bot, the ramp has it up. */
  private mayVisit(bot: BotRuntime<TPersona>): boolean {
    return (
      this.kindEnabled(bot) &&
      !this.state.disabledBots.includes(bot.profile.id) &&
      (bot.profile.kind !== BOT_KIND.load || this.spawned.has(bot.profile.id))
    );
  }

  private nextVisit(bot: BotRuntime<TPersona>, now: Date): Date {
    return bot.profile.kind === BOT_KIND.load && this.isBurst()
      ? burstWakeAt(now, bot.rng)
      : nextWakeAt(now, bot.rng, this.deps.app.timeZone);
  }

  private thinkTime(bot: BotRuntime<TPersona>): number {
    return bot.profile.kind === BOT_KIND.load && this.isBurst() ? burstThinkTimeMs(bot.rng) : thinkTimeMs(bot.rng);
  }

  private dailyEnabled(): boolean {
    return this.state.dailyEnabled === true;
  }

  private loadEnabled(): boolean {
    return this.state.loadEnabled === true;
  }

  /** The switch of the bot's kind: "Daily bots" or "Load bots". */
  private kindEnabled(bot: BotRuntime<TPersona>): boolean {
    return bot.profile.kind === BOT_KIND.load ? this.loadEnabled() : this.dailyEnabled();
  }

  private isBurst(): boolean {
    return this.state.loadPace === LOAD_PACE.burst;
  }

  private ramp(): RampSettings {
    return this.state.ramp ?? DEFAULT_RAMP;
  }

  /** The load bots the operator wants up right now: the target, or none while the switch is off. */
  private effectiveTarget(): number {
    return this.loadEnabled() ? (this.state.target ?? 0) : 0;
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
    bot.sessionStartedAt = new Date();
  }

  /** Writes the last 24 h to disk when something changed, at most once a minute. */
  private saveDayIfDue(): void {
    const now = Date.now();
    if (!this.dayDirty || !this.deps.saveActivity || now - this.daySavedAt < ACTIVITY_SAVE_MS) {
      return;
    }
    this.dayDirty = false;
    this.daySavedAt = now;
    const bots: DayActivity["bots"] = {};
    for (const bot of this.bots.values()) {
      const slices = bot.day.read().filter(({ bucket }) => bucket.actions + bucket.errors > 0);
      if (slices.length > 0) bots[bot.profile.id] = slices;
    }
    this.deps.saveActivity({ runner: this.day.read(), bots }).catch((error: unknown) => {
      logger.warn("activity not saved", { app: this.deps.app.id, error: String(error) });
    });
  }

  /** The action already ran as many times as it may in this visit (never in a burst-paced one). */
  private visitCapReached(bot: BotRuntime<TPersona>, check: VisitCheck<TPersona>): boolean {
    const { action, visit } = check;
    if (action.maxPerVisit === undefined || (bot.profile.kind === BOT_KIND.load && this.isBurst())) {
      return false;
    }
    return (visit.get(action.name) ?? 0) >= action.maxPerVisit;
  }

  private async runOneAction(bot: BotRuntime<TPersona>, visit: Map<string, number>): Promise<void> {
    const ctx: ActionContext<TPersona> = {
      bot: bot.profile,
      client: bot.client,
      rng: bot.rng,
      memory: bot.memory,
      uploads: this.deps.uploads,
      now: () => new Date(),
    };
    const quiet = this.quietHours().active;
    const candidates = this.deps.actions.filter(
      (action) =>
        !this.state.disabledActions.includes(action.name) &&
        !(quiet && action.pausedInQuietHours) &&
        !this.visitCapReached(bot, { action, visit }) &&
        (action.canRun?.(ctx) ?? true),
    );
    const action = bot.rng.weighted(candidates, (candidate: BotAction<TPersona>) => candidate.weight);
    if (!action) {
      return;
    }
    const stats = this.actionStats.get(action.name);
    visit.set(action.name, (visit.get(action.name) ?? 0) + 1);
    this.dayDirty = true;
    bot.currentAction = action.name;
    bot.byAction.set(action.name, (bot.byAction.get(action.name) ?? 0) + 1);
    const started = Date.now();
    try {
      await action.run(ctx);
      bot.totalActions += 1;
      bot.activity.current().actions += 1;
      bot.day.current().actions += 1;
      for (const slice of [this.activity.current(), this.day.current()]) {
        slice.actions += 1;
        slice.byAction[action.name] = (slice.byAction[action.name] ?? 0) + 1;
      }
      if (stats) stats.runs += 1;
      this.recentActions.push(Date.now());
      logger.info("action", { bot: bot.profile.id, action: action.name, ms: Date.now() - started });
    } catch (error) {
      bot.errors += 1;
      bot.activity.current().errors += 1;
      bot.day.current().errors += 1;
      this.activity.current().errors += 1;
      this.day.current().errors += 1;
      if (stats) stats.errors += 1;
      this.recentErrors.push(Date.now());
      if (error instanceof SessionExpiredError) {
        bot.signedIn = false;
        bot.sessionStartedAt = null;
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

function toggleIn(list: string[], id: string, enabled: boolean): string[] {
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
