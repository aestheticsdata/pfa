import { LOAD_PACE } from "#app/contracts/panel.js";
import { isQuiet, quietSnapshot } from "#app/infrastructure/quiet-hours.js";
import { SeededRandom } from "#app/mock/seeded-random.js";

import type {
  ActionRun,
  BotSeed,
  SimulatedAction,
  SimulatedBot,
  SimulationSeed,
  SimulationSlice,
} from "#app/mock/interfaces/mockTypes.js";
import type {
  RunnerAction,
  RunnerActivityPoint,
  RunnerBot,
  RunnerBotDetail,
  RunnerBotSpark,
  RunnerBulkResult,
  RunnerQuietHours,
  RunnerQuietHoursInput,
  RunnerRamp,
  RunnerStatus,
  RunnerToggle,
} from "#app/runner/interfaces/runnerApiTypes.js";
import type { RunnerClient } from "#app/runner/interfaces/runnerClientTypes.js";

/** One tick per second: the runner's 80 s chart is in 1-second slices (handoff v5). */
const TICK_MS = 1_000;
const SLICES = 80;
/** Each bot's sparkline is 15 slices of 2 s: a new one every other tick. */
const BOT_SLICES = 15;
const TICKS_PER_BOT_SLICE = 2;
/** The day charts (PFA-204): 24 slices of 1 h. */
const HOUR_MS = 3_600_000;
const DAY_SLICES = 24;
/** The overview's day chart: 15-minute slices (PFA-206). */
const QUARTERS = 4;
const QUARTER_MS = HOUR_MS / QUARTERS;
const QUARTER_SHARES = [0.4, 0.1, 0.3, 0.2];
const MB = 1024 * 1024;
const LIMITS = { maxBots: 500, maxRps: 40, uploadBudgetBytes: 400 * MB, uploadWindowDays: 365 };
const DAILY = ["saturnus", "ceres", "janus", "minerva"];
const TIME_ZONE = "Europe/Paris";
const BOOT_TARGET = 120;
const BOOT_SPAWNED = 84;
const MAX_ACTIVE_VISITS = 50;
/** Load bots that fail a lot, so the table has a few "degraded" rows. */
const FLAKY = new Set([7, 23, 61]);
/** Turned off by the operator, so the table has a few "paused" rows. */
const PAUSED = new Set([5, 20, 34, 53]);
/** How long a load bot has been up at boot, in hours: most of a day, so the day charts are a day. */
const LOAD_UPTIME_HOURS = { min: 6, max: 22 };
/**
 * A day's shape by Paris hour, 0 → 23: the load pace follows waking hours (`LOAD_PACE.daily`), quiet
 * at night, a lunch and an evening peak — so the 24 h charts read as a day, not a flat line.
 */
const WAKING = [
  0.1, 0.05, 0.05, 0.05, 0.05, 0.1, 0.25, 0.5, 0.75, 0.85, 0.9, 1, 1.1, 0.95, 0.8, 0.8, 0.85, 0.95, 1.1, 1.2, 1.05, 0.8,
  0.5, 0.25,
];
const PARIS_HOUR = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE });

/** PFA's real registry, with the error rates a busy day would show. */
const ACTIONS: SimulatedAction[] = [
  {
    name: "spending.add",
    description: "Adds a spending from the bot's own catalog (bounded amount, plausible date, pooled category)",
    weight: 50,
    path: "POST /api/spendings",
    errorRate: 0.012,
    quiet: true,
  },
  {
    name: "receipt.upload",
    description: "Attaches one of the ten fixed receipt pictures to the bot's last spending (upload budget)",
    weight: 8,
    path: "POST /api/spendings/upload",
    errorRate: 0.008,
    upload: true,
  },
  {
    name: "dashboard.view",
    description: "Opens the dashboard of the current month (read traffic)",
    weight: 25,
    path: "GET /api/dashboard",
    errorRate: 0.002,
  },
  {
    name: "statistics.view",
    description: "Opens the statistics of the current year (read traffic)",
    weight: 10,
    path: "GET /api/monthlystats",
    errorRate: 0.004,
  },
];

/**
 * A runner that doesn't exist: the back-office's mock mode (local dev without runner nor PFA, and
 * the portfolio film). Same interface as the real client; a fixed seed and a 2-second tick, so the
 * numbers move like a live run and are the same at every take. Never used in live mode.
 */
export class SimulatedRunnerClient implements RunnerClient {
  private readonly random: SeededRandom;
  private readonly fleet: SimulatedBot[] = [];
  private readonly slices: SimulationSlice[] = [];
  private readonly disabledActions = new Set<string>();
  private readonly runs = new Map<string, { runs: number; errors: number }>();
  private dailyEnabled: boolean;
  private target: number;
  private spawned: number;
  private ramp: RunnerRamp = { step: 10, everySec: 30 };
  private loadEnabled: boolean;
  private loadPace: string = LOAD_PACE.daily;
  private nextStepAt: number;
  private quiet: RunnerQuietHoursInput = { from: "22:00", to: "10:00" };
  private usedBytes: number;
  private weekUploads: number;
  private weekBytes: number;
  private ticks = 0;
  /** `floor(now / 1 h)` of the newest day slice. */
  private hour = Math.floor(Date.now() / HOUR_MS);

  constructor(seed: SimulationSeed) {
    this.random = new SeededRandom(seed.seed);
    this.dailyEnabled = seed.populated;
    this.loadEnabled = seed.populated;
    this.target = seed.populated ? BOOT_TARGET : 0;
    this.spawned = seed.populated ? BOOT_SPAWNED : 0;
    this.usedBytes = seed.populated ? 212.6 * MB : 0;
    this.weekUploads = seed.populated ? 318 : 0;
    this.weekBytes = seed.populated ? 38.2 * MB : 0;
    this.nextStepAt = Date.now() + this.ramp.everySec * 1000;
    for (const action of ACTIONS) this.runs.set(action.name, { runs: 0, errors: 0 });
    if (seed.populated) {
      DAILY.forEach((name, i) => {
        this.fleet.push(this.makeBot({ id: name, kind: "daily", n: i }));
      });
      for (let n = 1; n <= BOOT_TARGET; n++) {
        this.fleet.push(this.makeBot({ id: `legionary-${String(n).padStart(3, "0")}`, kind: "load", n }));
      }
      this.warmUp();
    }
    for (let i = 0; i < SLICES; i++) this.slices.push(this.emptySlice(Date.now() - (SLICES - i) * TICK_MS));
    // Unref'd: a simulation must never keep the process alive on its own.
    setInterval(() => this.tick(), TICK_MS).unref();
  }

  async status(): Promise<RunnerStatus> {
    const daily = this.fleet.filter((bot) => bot.kind === "daily");
    const load = this.fleet.filter((bot) => bot.kind === "load");
    const counts: Record<string, number> = {};
    for (const bot of this.fleet) counts[this.stateOf(bot)] = (counts[this.stateOf(bot)] ?? 0) + 1;
    const last = this.slices.slice(-60);
    const actionsPerMin = last.reduce((sum, slice) => sum + slice.actions, 0);
    const requestsPerMin = last.reduce((sum, slice) => sum + slice.requests, 0);
    return {
      app: "simulated",
      running: this.dailyEnabled || this.loadEnabled,
      dailyEnabled: this.dailyEnabled,
      bots: counts,
      liveDaily: daily.filter((bot) => this.isLive(bot)).length,
      totalDaily: daily.length,
      liveLoad: load.filter((bot) => this.isLive(bot)).length,
      totalLoad: load.length,
      target: this.target,
      spawned: Math.min(this.spawned, this.target),
      ramp: this.ramp,
      loadEnabled: this.loadEnabled,
      loadPace: this.loadPace,
      activeVisits: Math.min(MAX_ACTIVE_VISITS, this.fleet.filter((bot) => this.stateOf(bot) === "active").length),
      maxActiveVisits: MAX_ACTIVE_VISITS,
      nextStepInSec:
        this.loadEnabled && this.spawned < this.target
          ? Math.max(0, Math.ceil((this.nextStepAt - Date.now()) / 1000))
          : null,
      actionsPerMin,
      errorsPerMin: last.reduce((sum, slice) => sum + slice.errors, 0),
      requestsPerMin,
      rps: requestsPerMin / 60,
      throttled: this.slices.slice(-10).some((slice) => slice.throttled),
      limits: LIMITS,
      uploadBudget: {
        budgetBytes: LIMITS.uploadBudgetBytes,
        usedBytes: this.usedBytes,
        remainingBytes: LIMITS.uploadBudgetBytes - this.usedBytes,
        uploadsThisWeek: this.weekUploads,
        bytesThisWeek: this.weekBytes,
      },
      quietHours: quietSnapshot(this.quiet, TIME_ZONE),
    };
  }

  async history(): Promise<RunnerActivityPoint[]> {
    return this.slices.map((slice) => {
      const sorted = [...slice.latencies].sort((a, b) => a - b);
      const pick = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
      return {
        at: new Date(slice.at).toISOString(),
        actions: slice.actions,
        errors: slice.errors,
        byAction: {},
        errorsByAction: {},
        byBot: {},
        requests: slice.requests,
        p50: pick(0.5),
        p95: pick(0.95),
        codes2xx: slice.codes2xx,
        codes4xx: slice.codes4xx,
        codes5xx: slice.codes5xx,
        live: slice.live,
        target: slice.target,
        throttled: slice.throttled,
      };
    });
  }

  /** The last 24 h in 15-minute slices: each simulated hour spread over its quarters, by action weight. */
  async dayHistory(): Promise<RunnerActivityPoint[]> {
    const live = this.fleet.filter((bot) => this.isLive(bot)).length;
    const target = this.fleet.filter((bot) => bot.kind === "daily").length + (this.loadEnabled ? this.target : 0);
    return Array.from({ length: DAY_SLICES * QUARTERS }, (_, q) => {
      const hour = Math.floor(q / QUARTERS);
      // The quarter's share of its hour, rotated so the hours don't all look alike (same seed, same film).
      const share = QUARTER_SHARES[(q + hour) % QUARTERS] ?? 0;
      const quarter = (count: number) => Math.round(count * share);
      const actions = quarter(this.fleet.reduce((sum, bot) => sum + (bot.day[hour]?.actions ?? 0), 0));
      const errors = quarter(this.fleet.reduce((sum, bot) => sum + (bot.day[hour]?.errors ?? 0), 0));
      const busy = actions + errors > 0;
      return {
        at: new Date(((this.hour - DAY_SLICES + 1) * QUARTERS + q) * QUARTER_MS).toISOString(),
        actions,
        errors,
        byAction: byWeight(actions),
        errorsByAction: errors > 0 ? { [ACTIONS[0]?.name ?? "spending.add"]: errors } : {},
        byBot: Object.fromEntries(
          this.fleet
            .map((bot) => [bot.id, quarter((bot.day[hour]?.actions ?? 0) + (bot.day[hour]?.errors ?? 0))] as const)
            .filter(([, runs]) => runs > 0),
        ),
        requests: actions + errors,
        p50: busy ? Math.round(60 + ((q * 37) % 40)) : 0,
        p95: busy ? Math.round(180 + ((q * 53) % 160)) : 0,
        codes2xx: actions,
        codes4xx: Math.round(errors * 0.4),
        codes5xx: errors - Math.round(errors * 0.4),
        live,
        target,
        throttled: false,
      };
    });
  }

  async bots(): Promise<RunnerBot[]> {
    return this.fleet.map((bot) => this.toRunnerBot(bot));
  }

  async bot(id: string): Promise<RunnerBotDetail | null> {
    const bot = this.fleet.find((candidate) => candidate.id === id);
    return bot ? { ...this.toRunnerBot(bot), byAction: bot.byAction, recentRequests: bot.recentRequests } : null;
  }

  async actions(): Promise<RunnerAction[]> {
    return ACTIONS.map((action) => ({
      name: action.name,
      description: action.description,
      weight: action.weight,
      enabled: !this.disabledActions.has(action.name),
      pausedInQuietHours: action.quiet === true,
      usesUploadBudget: action.upload === true,
      runs: this.runs.get(action.name)?.runs ?? 0,
      errors: this.runs.get(action.name)?.errors ?? 0,
    }));
  }

  async setDaily(enabled: boolean): Promise<boolean> {
    this.dailyEnabled = enabled;
    this.resetBotsOf("daily");
    return enabled;
  }

  async setTarget(target: number): Promise<number> {
    this.target = Math.max(0, Math.min(LIMITS.maxBots, Math.floor(target)));
    const load = this.fleet.filter((bot) => bot.kind === "load").length;
    for (let n = load + 1; n <= this.target; n++) {
      this.fleet.push(this.makeBot({ id: `legionary-${String(n).padStart(3, "0")}`, kind: "load", n }));
    }
    // Scale-down is immediate (handoff): the bots above the target go back to the queue.
    this.spawned = Math.min(this.spawned, this.target);
    return this.target;
  }

  async setRamp(ramp: RunnerRamp): Promise<RunnerRamp> {
    this.ramp = { step: Math.max(1, Math.floor(ramp.step)), everySec: Math.max(1, Math.floor(ramp.everySec)) };
    this.nextStepAt = Date.now() + this.ramp.everySec * 1000;
    return this.ramp;
  }

  async setLoad(enabled: boolean): Promise<boolean> {
    this.loadEnabled = enabled;
    this.resetBotsOf("load");
    // Off: every load bot back to the queue at once. On: the first step comes up now.
    if (!enabled) this.spawned = 0;
    else this.nextStepAt = Date.now();
    return enabled;
  }

  async setLoadPace(pace: string): Promise<string> {
    this.loadPace = pace;
    return pace;
  }

  async setQuietHours(hours: RunnerQuietHoursInput): Promise<RunnerQuietHours> {
    this.quiet = { from: hours.from, to: hours.to };
    return quietSnapshot(this.quiet, TIME_ZONE);
  }

  async setBots(toggle: RunnerToggle): Promise<RunnerBulkResult> {
    const updated: string[] = [];
    const unknown: string[] = [];
    for (const id of toggle.ids) {
      const bot = this.fleet.find((candidate) => candidate.id === id);
      if (!bot) {
        unknown.push(id);
        continue;
      }
      // Turned on while its kind is off: the kind comes on with only this bot (as in the real runner).
      if (toggle.enabled && !this.kindOn(bot)) this.turnKindOnAlone(bot.kind);
      bot.enabled = toggle.enabled;
      updated.push(id);
    }
    return { updated, unknown };
  }

  async restartSession(id: string): Promise<boolean> {
    const bot = this.fleet.find((candidate) => candidate.id === id);
    if (!bot) return false;
    bot.sessionStartedAt = Date.now();
    bot.recentRequests = [];
    return true;
  }

  async setAction(name: string, enabled: boolean): Promise<boolean> {
    if (!ACTIONS.some((action) => action.name === name)) return false;
    if (enabled) this.disabledActions.delete(name);
    else this.disabledActions.add(name);
    return true;
  }

  async enableAllActions(): Promise<void> {
    this.disabledActions.clear();
  }

  async closeAccount(id: string): Promise<boolean> {
    const bot = this.fleet.find((candidate) => candidate.id === id);
    if (!bot) return false;
    bot.blocked = true;
    bot.currentAction = null;
    bot.sessionStartedAt = null;
    return true;
  }

  /** A bot's runner state: the same words the real runner uses, plus "queued" for load bots not up yet. */
  private stateOf(bot: SimulatedBot): string {
    if (bot.blocked) return "blocked";
    if (!this.kindOn(bot)) return "stopped";
    if (!bot.enabled) return "paused";
    if (bot.kind === "load" && this.loadRank(bot) > this.spawned) return "queued";
    return bot.currentAction ? "active" : "sleeping";
  }

  /** A load bot's place in the ramp: bots turned off or blocked take none (as in the real runner). */
  private loadRank(bot: SimulatedBot): number {
    const before = this.fleet.filter(
      (other) =>
        other.kind === "load" && other.enabled && !other.blocked && this.loadIndex(other) < this.loadIndex(bot),
    );
    return before.length + 1;
  }

  private kindOn(bot: SimulatedBot): boolean {
    return bot.kind === "load" ? this.loadEnabled : this.dailyEnabled;
  }

  /** A kind's switch, flipped either way, sets every bot of that kind to follow it. */
  private resetBotsOf(kind: SimulatedBot["kind"]): void {
    for (const bot of this.fleet) if (bot.kind === kind) bot.enabled = true;
  }

  private turnKindOnAlone(kind: SimulatedBot["kind"]): void {
    for (const bot of this.fleet) if (bot.kind === kind) bot.enabled = false;
    if (kind === "load") {
      this.loadEnabled = true;
      this.nextStepAt = Date.now();
    } else {
      this.dailyEnabled = true;
    }
  }

  private isLive(bot: SimulatedBot): boolean {
    const state = this.stateOf(bot);
    return state === "active" || state === "sleeping";
  }

  private loadIndex(bot: SimulatedBot): number {
    return Number(bot.id.slice("legionary-".length));
  }

  private toRunnerBot(bot: SimulatedBot): RunnerBot {
    const attempts = bot.totalActions + bot.errors;
    return {
      id: bot.id,
      email: bot.email,
      kind: bot.kind,
      state: this.stateOf(bot),
      // A kind switched off shows all its bots off.
      enabled: this.kindOn(bot) && bot.enabled,
      currentAction: this.isLive(bot) ? bot.currentAction : null,
      totalActions: bot.totalActions,
      errors: bot.errors,
      uploads: bot.uploads,
      actionsPerMin: this.isLive(bot) ? bot.actionsPerMin : 0,
      errorRate: attempts === 0 ? 0 : bot.errors / attempts,
      spark: bot.spark,
      daySpark: bot.day,
      sessionStartedAt: bot.sessionStartedAt ? new Date(bot.sessionStartedAt).toISOString() : null,
      lastSeenAt: bot.lastSeenAt ? new Date(bot.lastSeenAt).toISOString() : null,
      nextWakeAt: null,
    };
  }

  private makeBot(spec: BotSeed): SimulatedBot {
    const daily = spec.kind === "daily";
    return {
      id: spec.id,
      email: `${spec.id}@synthetic.test`,
      kind: spec.kind,
      pace: daily ? 0.8 + spec.n * 0.3 : 2 + ((spec.n * 37) % 50) / 10,
      flaky: !daily && FLAKY.has(spec.n),
      enabled: daily || !PAUSED.has(spec.n),
      blocked: false,
      currentAction: null,
      totalActions: 0,
      errors: 0,
      uploads: 0,
      actionsPerMin: 0,
      spark: Array.from({ length: BOT_SLICES }, () => ({ actions: 0, errors: 0 })),
      day: Array.from({ length: DAY_SLICES }, () => ({ actions: 0, errors: 0 })),
      byAction: {},
      recentRequests: [],
      sessionStartedAt: null,
      lastSeenAt: null,
    };
  }

  /** History before the boot, so the first screen is a run in progress rather than zeros. */
  private warmUp(): void {
    const now = Date.now();
    this.fleet.forEach((bot, i) => {
      const daily = bot.kind === "daily";
      const minutes = daily
        ? (9 + i * 4) * 1440 * 0.35
        : this.random.between(LOAD_UPTIME_HOURS.min, LOAD_UPTIME_HOURS.max) * 60;
      bot.totalActions = Math.round(bot.pace * minutes);
      bot.errors = Math.round(bot.totalActions * (bot.flaky ? 0.18 : 0.006));
      bot.uploads = Math.round(bot.totalActions * 0.03);
      bot.sessionStartedAt = now - (daily ? (9 + i * 4) * 86_400_000 : minutes * 60_000);
      bot.lastSeenAt = now - this.random.int(1, 40) * 1000;
      // A daily bot's past day: a couple of short visits; a load bot's: busy since it came up.
      bot.day = bot.day.map((slice, hour) => {
        const busy = daily ? this.random.chance(0.12) : hour >= DAY_SLICES - Math.ceil(minutes / 60);
        if (!busy || hour === DAY_SLICES - 1) return slice;
        const shape = WAKING[Number(PARIS_HOUR.format((this.hour - DAY_SLICES + 1 + hour) * HOUR_MS))] ?? 1;
        const actions = daily ? this.random.int(1, 5) : Math.round(bot.pace * shape * this.random.between(20, 60));
        return { actions, errors: bot.flaky ? Math.round(actions * 0.18) : 0 };
      });
      for (const action of ACTIONS) {
        bot.byAction[action.name] = Math.round((bot.totalActions * action.weight) / 93);
      }
    });
    for (const action of ACTIONS) {
      const runs = this.fleet.reduce((sum, bot) => sum + (bot.byAction[action.name] ?? 0), 0);
      this.runs.set(action.name, { runs, errors: Math.round(runs * action.errorRate) });
    }
  }

  private emptySlice(at: number): SimulationSlice {
    return {
      at,
      actions: 0,
      errors: 0,
      requests: 0,
      latencies: [],
      codes2xx: 0,
      codes4xx: 0,
      codes5xx: 0,
      live: 0,
      target: 0,
      throttled: false,
    };
  }

  private tick(): void {
    const now = Date.now();
    if (this.loadEnabled && this.spawned < this.target && now >= this.nextStepAt) {
      this.spawned = Math.min(this.target, this.spawned + this.ramp.step);
      this.nextStepAt = now + this.ramp.everySec * 1000;
    }
    const quiet = isQuiet(new Date(now), this.quiet, TIME_ZONE);
    const usable = ACTIONS.filter(
      (action) =>
        !this.disabledActions.has(action.name) &&
        !(quiet && action.quiet) &&
        !(action.upload && this.usedBytes >= LIMITS.uploadBudgetBytes),
    );
    const totalWeight = usable.reduce((sum, action) => sum + action.weight, 0);
    const slice = this.emptySlice(now);
    this.ticks += 1;
    const newSpark = this.ticks % TICKS_PER_BOT_SLICE === 0;
    const hour = Math.floor(now / HOUR_MS);
    const newHours = Math.min(DAY_SLICES, hour - this.hour);
    this.hour = hour;
    for (const bot of this.fleet) {
      const live = this.isLive(bot);
      if (newSpark) bot.spark = [...bot.spark.slice(1), { actions: 0, errors: 0 }];
      for (let i = 0; i < newHours; i++) bot.day = [...bot.day.slice(1), { actions: 0, errors: 0 }];
      const spark = bot.spark[bot.spark.length - 1] ?? { actions: 0, errors: 0 };
      if (live && totalWeight > 0) {
        bot.actionsPerMin = bot.pace * this.random.between(0.7, 1.3);
        const expected = bot.actionsPerMin / 60;
        const count = Math.floor(expected) + (this.random.chance(expected % 1) ? 1 : 0);
        for (let i = 0; i < count; i++) this.runAction({ bot, usable, totalWeight, slice, spark, now });
        bot.lastSeenAt = now;
      } else {
        bot.actionsPerMin = 0;
        bot.currentAction = null;
      }
      if (live) slice.live += 1;
    }
    slice.target = this.fleet.filter((bot) => bot.kind === "daily").length + (this.loadEnabled ? this.target : 0);
    // The RPS cap: past it, requests queue — the "throttled" the status tile warns about.
    const capPerSlice = (LIMITS.maxRps * TICK_MS) / 1000;
    slice.throttled = slice.requests > capPerSlice;
    this.slices.push(slice);
    this.slices.splice(0, this.slices.length - SLICES);
  }

  /** The bot's slice of the hour in progress. */
  private dayNow(bot: SimulatedBot): RunnerBotSpark {
    const slice = bot.day[DAY_SLICES - 1] ?? { actions: 0, errors: 0 };
    bot.day[DAY_SLICES - 1] = slice;
    return slice;
  }

  private runAction(run: ActionRun): void {
    const { bot, slice, spark } = run;
    const roll = this.random.next() * run.totalWeight;
    let reached = 0;
    const action =
      run.usable.find((candidate) => {
        reached += candidate.weight;
        return roll < reached;
      }) ?? run.usable[0];
    if (!action) return;
    const failed = this.random.chance(bot.flaky ? 0.25 : action.errorRate);
    const status = failed ? (this.random.chance(0.6) ? 500 : 422) : action.path.startsWith("POST") ? 201 : 200;
    const ms = Math.round(40 + this.random.next() * (failed ? 900 : action.upload ? 600 : 220));
    bot.currentAction = action.name;
    bot.byAction[action.name] = (bot.byAction[action.name] ?? 0) + 1;
    const stats = this.runs.get(action.name) ?? { runs: 0, errors: 0 };
    stats.runs += 1;
    const [method = "GET", path = "/"] = action.path.split(" ");
    bot.recentRequests = [
      { at: new Date(run.now).toISOString(), method, path, status, ms },
      ...bot.recentRequests,
    ].slice(0, 14);
    slice.requests += 1;
    slice.latencies.push(ms);
    if (failed) {
      bot.errors += 1;
      stats.errors += 1;
      spark.errors += 1;
      this.dayNow(bot).errors += 1;
      slice.errors += 1;
      if (status >= 500) slice.codes5xx += 1;
      else slice.codes4xx += 1;
    } else {
      bot.totalActions += 1;
      spark.actions += 1;
      this.dayNow(bot).actions += 1;
      slice.actions += 1;
      slice.codes2xx += 1;
      if (action.upload) {
        const bytes = this.random.between(3.5, 6.4) * 1024;
        this.usedBytes = Math.min(LIMITS.uploadBudgetBytes, this.usedBytes + bytes);
        this.weekUploads += 1;
        this.weekBytes += bytes;
        bot.uploads += 1;
      }
    }
    this.runs.set(action.name, stats);
  }
}

/** `count` actions split over the registry by weight, the rounding left to the heaviest. */
function byWeight(count: number): Record<string, number> {
  const total = ACTIONS.reduce((sum, action) => sum + action.weight, 0);
  const split: Record<string, number> = {};
  let left = count;
  for (const action of ACTIONS.slice(1)) {
    const share = Math.floor((count * action.weight) / total);
    if (share > 0) split[action.name] = share;
    left -= share;
  }
  const first = ACTIONS[0];
  if (first && left > 0) split[first.name] = left;
  return split;
}
