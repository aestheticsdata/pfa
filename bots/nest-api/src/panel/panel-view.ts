import { BOT_VIEW_STATE } from "#app/contracts/panel.js";

import type {
  ActionView,
  ActivityPoint,
  BotView,
  HistogramBucket,
  StatusView,
  UploadBudgetView,
} from "#app/contracts/interfaces/panelTypes.js";
import type { ActionShare, BotFacts } from "#app/panel/interfaces/panelViewTypes.js";
import type {
  RunnerAction,
  RunnerActivityPoint,
  RunnerBot,
  RunnerStatus,
  RunnerUploadBudget,
} from "#app/runner/interfaces/runnerApiTypes.js";

const MB = 1024 * 1024;
const WEEK_DAYS = 7;
/** A live bot failing more than this share of its last 30 s is shown "degraded". */
const DEGRADED_ERROR_SHARE = 0.2;
/** The Metrics histogram's buckets, actions/min per live bot (handoff). */
const ACTIVITY_EDGES = [1, 2, 3, 4, 5, 6, Number.POSITIVE_INFINITY];
const ACTIVITY_LABELS = ["<1", "1–2", "2–3", "3–4", "4–5", "5–6", "6+"];

const round = (value: number, digits = 1): number => Math.round(value * 10 ** digits) / 10 ** digits;

/**
 * The runner's states in the panel's words: `active` and `sleeping` both mean the bot is live
 * (between visits a daily bot sleeps — it is still running), unless its last 30 s are mostly errors.
 */
export function viewState(bot: RunnerBot): string {
  switch (bot.state) {
    case "active":
    case "sleeping": {
      const actions = bot.spark.reduce((sum, slice) => sum + slice.actions, 0);
      const errors = bot.spark.reduce((sum, slice) => sum + slice.errors, 0);
      return errors > 0 && errors / (actions + errors) > DEGRADED_ERROR_SHARE
        ? BOT_VIEW_STATE.degraded
        : BOT_VIEW_STATE.running;
    }
    case "paused":
      return BOT_VIEW_STATE.paused;
    case "queued":
      return BOT_VIEW_STATE.queued;
    case "blocked":
      return BOT_VIEW_STATE.blocked;
    default:
      return BOT_VIEW_STATE.stopped;
  }
}

export function isLiveState(state: string): boolean {
  return state === BOT_VIEW_STATE.running || state === BOT_VIEW_STATE.degraded;
}

export function botView({ bot, incident }: BotFacts): BotView {
  return {
    id: bot.id,
    email: bot.email,
    kind: bot.kind,
    state: viewState(bot),
    enabled: bot.enabled,
    currentAction: bot.currentAction,
    actionsPerMin: round(bot.actionsPerMin),
    errorRate: round(bot.errorRate * 100),
    total: bot.totalActions,
    uploads: bot.uploads,
    lastSeenAt: bot.lastSeenAt,
    sessionStartedAt: bot.sessionStartedAt,
    spark: bot.spark,
    incident,
  };
}

export function uploadBudgetView(budget: RunnerUploadBudget): UploadBudgetView {
  const perDay = budget.bytesThisWeek / WEEK_DAYS;
  return {
    usedMB: round(budget.usedBytes / MB),
    budgetMB: round(budget.budgetBytes / MB),
    remainingMB: round(budget.remainingBytes / MB),
    weekUploads: budget.uploadsThisWeek,
    weekMB: round(budget.bytesThisWeek / MB),
    emptyInDays: perDay > 0 ? Math.round(budget.remainingBytes / perDay) : null,
  };
}

export function statusView(status: RunnerStatus): StatusView {
  const attempts = status.actionsPerMin + status.errorsPerMin;
  return {
    running: status.running,
    liveDaily: status.liveDaily,
    totalDaily: status.totalDaily,
    liveLoad: status.liveLoad,
    target: status.target,
    spawned: status.spawned,
    ramp: status.ramp,
    loadEnabled: status.loadEnabled,
    loadPace: status.loadPace,
    activeVisits: status.activeVisits,
    maxActiveVisits: status.maxActiveVisits,
    nextStepInSec: status.nextStepInSec,
    actionsPerMin: status.actionsPerMin,
    rps: round(status.rps),
    throttled: status.throttled,
    errorRate: attempts === 0 ? 0 : round((status.errorsPerMin / attempts) * 100),
    errorsPerMin: status.errorsPerMin,
    quietHours: status.quietHours,
    limits: {
      maxBots: status.limits.maxBots,
      maxRps: status.limits.maxRps,
      uploadBudgetMB: round(status.limits.uploadBudgetBytes / MB),
      windowDays: status.limits.uploadWindowDays,
    },
    uploadBudget: uploadBudgetView(status.uploadBudget),
  };
}

/**
 * The runner counts per 1-second slice; the charts read "per minute". Each slice is scaled to the
 * rate it represents, so the bars read in the same unit as the "Actions / min" tile.
 */
export function activityPoints(history: RunnerActivityPoint[]): ActivityPoint[] {
  const perMinute = 60;
  return history.map((point) => ({
    ...point,
    actions: point.actions * perMinute,
    errors: point.errors * perMinute,
    requests: point.requests * perMinute,
    codes2xx: point.codes2xx * perMinute,
    codes4xx: point.codes4xx * perMinute,
    codes5xx: point.codes5xx * perMinute,
  }));
}

/**
 * Each action's share of the current rate, by weight among the actions that can run now (the
 * handoff's rule): one switched off, or paused by quiet hours, reads "—" and gives its share away.
 */
export function actionViews({ actions, actionsPerMin, quietActive }: ActionShare): ActionView[] {
  const canRun = (action: RunnerAction) => action.enabled && !(quietActive && action.pausedInQuietHours);
  const weights = actions.filter(canRun).reduce((sum, action) => sum + action.weight, 0) || 1;
  return actions.map((action) => ({
    name: action.name,
    description: action.description,
    weight: action.weight,
    enabled: action.enabled,
    quiet: action.pausedInQuietHours,
    budget: action.usesUploadBudget,
    perMin: canRun(action) ? Math.round((actionsPerMin * action.weight) / weights) : null,
    errorRate: action.runs + action.errors === 0 ? 0 : round((action.errors / (action.runs + action.errors)) * 100),
  }));
}

export function activityHistogram(bots: BotView[]): HistogramBucket[] {
  const counts = ACTIVITY_EDGES.map(() => 0);
  for (const bot of bots) {
    const index = ACTIVITY_EDGES.findIndex((edge) => bot.actionsPerMin < edge);
    counts[index] = (counts[index] ?? 0) + 1;
  }
  return ACTIVITY_LABELS.map((label, i) => ({ label, count: counts[i] ?? 0 }));
}
