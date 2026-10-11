import { BOT_VIEW_STATE } from "#app/contracts/panel.js";
import {
  actionViews,
  activityHistogram,
  activityPoints,
  dayActivityHistogram,
  uploadBudgetView,
  viewState,
} from "#app/panel/panel-view.js";

import type { BotView } from "#app/contracts/interfaces/panelTypes.js";
import type { RunnerAction, RunnerBot } from "#app/runner/interfaces/runnerApiTypes.js";

const bot = (fields: Partial<RunnerBot>): RunnerBot => ({
  id: "ceres",
  email: "ceres@synthetic.test",
  kind: "daily",
  state: "sleeping",
  enabled: true,
  currentAction: null,
  totalActions: 0,
  errors: 0,
  uploads: 0,
  actionsPerMin: 0,
  errorRate: 0,
  spark: Array.from({ length: 15 }, () => ({ actions: 0, errors: 0 })),
  daySpark: Array.from({ length: 24 }, () => ({ actions: 0, errors: 0 })),
  sessionStartedAt: null,
  lastSeenAt: null,
  nextWakeAt: null,
  ...fields,
});

const action = (fields: Partial<RunnerAction>): RunnerAction => ({
  name: "spending.add",
  description: "",
  weight: 50,
  enabled: true,
  pausedInQuietHours: false,
  usesUploadBudget: false,
  runs: 0,
  errors: 0,
  ...fields,
});

describe("panel view", () => {
  it("reads a sleeping daily bot as running, and one failing most of its last 30 s as degraded", () => {
    expect(viewState(bot({ state: "sleeping" }))).toBe(BOT_VIEW_STATE.running);
    const failing = Array.from({ length: 15 }, () => ({ actions: 1, errors: 1 }));
    expect(viewState(bot({ state: "active", spark: failing }))).toBe(BOT_VIEW_STATE.degraded);
    expect(viewState(bot({ state: "stopped" }))).toBe(BOT_VIEW_STATE.stopped);
    expect(viewState(bot({ state: "blocked" }))).toBe(BOT_VIEW_STATE.blocked);
    expect(viewState(bot({ state: "queued" }))).toBe(BOT_VIEW_STATE.queued);
  });

  it("charts 1-second slices as per-minute rates", () => {
    const [point] = activityPoints([
      {
        at: "2026-10-10T12:00:00.000Z",
        actions: 2,
        errors: 1,
        byAction: { "spending.add": 2 },
        requests: 3,
        p50: 90,
        p95: 300,
        codes2xx: 2,
        codes4xx: 0,
        codes5xx: 1,
        live: 4,
        target: 4,
        throttled: false,
      },
    ]);
    expect(point).toMatchObject({ actions: 120, errors: 60, requests: 180, codes5xx: 60, p50: 90 });
  });

  it("gives a quiet or switched-off action no share of the rate, and splits it among the others", () => {
    const views = actionViews({
      actions: [
        action({ name: "spending.add", weight: 50, pausedInQuietHours: true }),
        action({ name: "dashboard.view", weight: 30 }),
        action({ name: "statistics.view", weight: 10, enabled: false }),
        action({ name: "receipt.upload", weight: 10, runs: 99, errors: 1 }),
      ],
      actionsPerMin: 40,
      quietActive: true,
    });
    expect(views.map((view) => view.perMin)).toEqual([null, 30, null, 10]);
    expect(views[3]?.errorRate).toBe(1);
  });

  it("says when the upload budget runs out at this week's pace", () => {
    const MB = 1024 * 1024;
    const view = uploadBudgetView({
      budgetBytes: 400 * MB,
      usedBytes: 330 * MB,
      remainingBytes: 70 * MB,
      uploadsThisWeek: 300,
      bytesThisWeek: 7 * MB,
    });
    expect(view).toMatchObject({ usedMB: 330, remainingMB: 70, weekMB: 7, emptyInDays: 70 });
    expect(
      uploadBudgetView({
        ...view,
        budgetBytes: 1,
        usedBytes: 0,
        remainingBytes: 1,
        uploadsThisWeek: 0,
        bytesThisWeek: 0,
      }).emptyInDays,
    ).toBeNull();
  });

  it("buckets live bots by pace", () => {
    const paces = [0.5, 1.5, 1.9, 6.5];
    const histogram = activityHistogram(paces.map((actionsPerMin) => ({ actionsPerMin }) as BotView));
    expect(histogram.map((bucket) => bucket.count)).toEqual([1, 2, 0, 0, 0, 0, 1]);
  });

  it("buckets live bots by their actions over the last 24 h", () => {
    const days = [0, 2, 4, 4, 60];
    const histogram = dayActivityHistogram(days.map((actions) => ({ daySpark: [{ actions, errors: 0 }] }) as BotView));
    expect(histogram.map((bucket) => bucket.count)).toEqual([1, 1, 2, 0, 0, 0, 1]);
  });
});
