import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOT_KIND, BOT_STATE, LOAD_PACE } from "@core/constants/bot";
import { BotBlockedError, SessionExpiredError } from "@core/engine/errors";
import { fakeRunner } from "@core/testing/fakeRunner";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Runner } from "@core/engine/runner";
import type { BotAction } from "@core/interfaces/actionTypes";
import type { DayActivity } from "@core/interfaces/metricsTypes";
import type { PersistedRunnerState } from "@core/interfaces/runnerTypes";

const tracked = (name: string, ran: string[]): BotAction<unknown> => ({
  name,
  description: name,
  weight: 1,
  run: async () => {
    ran.push(name);
  },
});

const secretsPath = async () => join(await mkdtemp(join(tmpdir(), "runner-")), "secrets.json");

describe("Runner guards", () => {
  it("refuses to exist with a bot outside the synthetic domain", async () => {
    await expect(fakeRunner({ emails: ["ceres@synthetic.test", "someone@gmail.com"] })).rejects.toThrow(
      /non-synthetic/,
    );
  });

  it("refuses more bots than the hard cap", async () => {
    await expect(fakeRunner({ emails: ["a@synthetic.test", "b@synthetic.test"], maxBots: 1 })).rejects.toThrow(
      /hard cap/,
    );
  });

  it("is stopped by default, and persists the daily switch", async () => {
    const saved: PersistedRunnerState[] = [];
    const runner = await fakeRunner({ saved, secretsPath: await secretsPath() });
    expect(runner.isRunning()).toBe(false);
    expect(runner.snapshotBots()[0]?.state).toBe(BOT_STATE.stopped);
    await runner.setDailyEnabled(true);
    expect(runner.isRunning()).toBe(true);
    await runner.setDailyEnabled(false);
    expect(saved.map((state) => state.dailyEnabled)).toEqual([true, false]);
  });

  it("never picks a disabled action, and stops a visit when the daily switch is off", async () => {
    const ran: string[] = [];
    const runner = await fakeRunner({
      actions: [tracked("a", ran), tracked("b", ran)],
      secretsPath: await secretsPath(),
    });
    await runner.setActionEnabled("b", false);
    await runner.runWake("bot-0", { actions: 6, thinkTimeMs: 0, force: true });
    expect(ran).toEqual(["a", "a", "a", "a", "a", "a"]);

    ran.length = 0;
    await runner.runWake("bot-0", { actions: 3, thinkTimeMs: 0 });
    expect(ran).toEqual([]);
  });

  it("runs an action at most `maxPerVisit` times in a visit", async () => {
    const ran: string[] = [];
    const runner = await fakeRunner({
      actions: [{ ...tracked("spend", ran), weight: 100, maxPerVisit: 1 }, tracked("browse", ran)],
      secretsPath: await secretsPath(),
    });
    await runner.runWake("bot-0", { actions: 6, thinkTimeMs: 0, force: true });
    expect(ran.filter((name) => name === "spend")).toHaveLength(1);
    expect(ran).toHaveLength(6);
  });

  it("does not replay the same visit times after a restart", async () => {
    vi.useFakeTimers();
    const wake = async (seed: string) => {
      const runner = await fakeRunner({ seed, secretsPath: await secretsPath() });
      await runner.setDailyEnabled(true);
      const at = runner.snapshotBots()[0]?.nextWakeAt;
      await runner.setDailyEnabled(false);
      return at;
    };
    expect(await wake("boot-1")).toBe(await wake("boot-1"));
    expect(await wake("boot-1")).not.toBe(await wake("boot-2"));
    vi.useRealTimers();
  });

  it("keeps the last 24 h across a restart, and saves it", async () => {
    const hour = Math.floor(Date.now() / 3_600_000) * 3_600_000;
    const quarter = Math.floor(Date.now() / 900_000) * 900_000;
    const savedActivity: DayActivity[] = [];
    const runner = await fakeRunner({
      actions: [tracked("a", [])],
      secretsPath: await secretsPath(),
      initialActivity: {
        runner: [{ at: quarter, bucket: { actions: 3, errors: 0 } }],
        bots: { "bot-0": [{ at: hour, bucket: { actions: 3, errors: 0 } }] },
      },
      savedActivity,
    });
    await runner.runWake("bot-0", { actions: 2, thinkTimeMs: 0, force: true });
    expect(runner.dayHistory()).toHaveLength(96);
    expect(runner.dayHistory().at(-1)).toMatchObject({
      actions: 5,
      errors: 0,
      byAction: { a: 2 },
      errorsByAction: {},
      byBot: { "bot-0": 2 },
      requests: 0,
      p50: 0,
      codes2xx: 0,
    });
    expect(runner.snapshotBots()[0]?.daySpark.at(-1)).toEqual({ actions: 5, errors: 0 });

    await runner.setDailyEnabled(true);
    await runner.setDailyEnabled(false);
    expect(savedActivity.at(-1)?.bots["bot-0"]?.at(-1)?.bucket).toEqual({ actions: 5, errors: 0 });
  });

  it("blocks a bot whose account is refused, and stops retrying it", async () => {
    let attempts = 0;
    const runner = await fakeRunner({
      actions: [tracked("a", [])],
      authenticate: async () => {
        attempts += 1;
        throw new BotBlockedError("sign-in refused (403)");
      },
      secretsPath: await secretsPath(),
    });
    await runner.runWake("bot-0", { actions: 2, thinkTimeMs: 0, force: true });
    await runner.runWake("bot-0", { actions: 2, thinkTimeMs: 0, force: true });
    expect(attempts).toBe(1);
    expect(runner.snapshotBots()[0]?.state).toBe(BOT_STATE.blocked);
  });

  it("signs in again after sleeping past the app's session lifetime, without an error", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    let signIns = 0;
    const runner = await fakeRunner({
      actions: [tracked("a", [])],
      authenticate: async () => {
        signIns += 1;
      },
      sessionIdleMs: 10 * 60_000,
      secretsPath: await secretsPath(),
    });
    await runner.runWake("bot-0", { actions: 1, thinkTimeMs: 0, force: true });
    vi.advanceTimersByTime(5 * 60_000);
    await runner.runWake("bot-0", { actions: 1, thinkTimeMs: 0, force: true });
    expect(signIns).toBe(1);
    vi.advanceTimersByTime(30 * 60_000);
    await runner.runWake("bot-0", { actions: 1, thinkTimeMs: 0, force: true });
    expect(signIns).toBe(2);
    expect(runner.snapshotBots()[0]?.errors).toBe(0);
    vi.useRealTimers();
  });

  it("retries an action once after signing in again when the session is gone", async () => {
    let signIns = 0;
    let calls = 0;
    const runner = await fakeRunner({
      actions: [
        {
          ...tracked("a", []),
          run: async () => {
            calls += 1;
            if (calls === 2) throw new SessionExpiredError("a: session expired");
          },
        },
      ],
      authenticate: async () => {
        signIns += 1;
      },
      secretsPath: await secretsPath(),
    });
    await runner.runWake("bot-0", { actions: 2, thinkTimeMs: 0, force: true });
    expect(calls).toBe(3);
    expect(signIns).toBe(2);
    expect(runner.snapshotBots()[0]?.errors).toBe(0);
  });

  it("counts an error when the session is refused again right after signing in", async () => {
    const runner = await fakeRunner({
      actions: [
        {
          ...tracked("a", []),
          run: async () => {
            throw new SessionExpiredError("a: session expired");
          },
        },
      ],
      secretsPath: await secretsPath(),
    });
    await runner.runWake("bot-0", { actions: 1, thinkTimeMs: 0, force: true });
    expect(runner.snapshotBots()[0]?.errors).toBe(1);
  });
});

const dailyState = (runner: Runner) => runner.snapshotBots().find((bot) => bot.id === "bot-0")?.state;

const stopAll = async (runner: Runner) => {
  await runner.setDailyEnabled(false);
  await runner.setLoadEnabled(false);
};

describe("Load bots", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const loadRunner = async () => {
    const saved: PersistedRunnerState[] = [];
    const runner = await fakeRunner({ loadBots: 30, saved, secretsPath: await secretsPath() });
    await runner.setRamp({ step: 10, everySec: 1 });
    return { runner, saved };
  };

  it("ramps up to the target a step at a time, and never counts the daily bot", async () => {
    vi.useFakeTimers();
    const { runner } = await loadRunner();
    await runner.setTarget(25);
    await runner.setLoadEnabled(true);
    await runner.setDailyEnabled(true);
    expect(runner.status().spawned).toBe(10);
    expect(runner.status().nextStepInSec).toBe(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(runner.status().spawned).toBe(20);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(runner.status().spawned).toBe(25);
    expect(runner.status().nextStepInSec).toBeNull();
    const states = runner.snapshotBots();
    expect(states.find((bot) => bot.id === "bot-0")?.state).toBe(BOT_STATE.sleeping);
    expect(states.filter((bot) => bot.state === BOT_STATE.queued)).toHaveLength(5);
    await stopAll(runner);
  });

  it("stops the excess at once when the target drops", async () => {
    vi.useFakeTimers();
    const { runner } = await loadRunner();
    await runner.setTarget(20);
    await runner.setLoadEnabled(true);
    await runner.setDailyEnabled(true);
    await vi.advanceTimersByTimeAsync(1_000);
    await runner.setTarget(3);
    expect(runner.status().spawned).toBe(3);
    await stopAll(runner);
  });

  it("the load switch stops every load bot, keeps the target and the daily bot, and comes back", async () => {
    vi.useFakeTimers();
    const { runner, saved } = await loadRunner();
    await runner.setTarget(10);
    await runner.setLoadEnabled(true);
    await runner.setDailyEnabled(true);
    expect(runner.status().spawned).toBe(10);

    await runner.setLoadEnabled(false);
    expect(runner.status()).toMatchObject({ spawned: 0, target: 10, loadEnabled: false, running: true });
    expect(runner.snapshotBots().find((bot) => bot.id === "bot-0")?.state).toBe(BOT_STATE.sleeping);
    expect(saved.at(-1)?.loadEnabled).toBe(false);

    await runner.setLoadEnabled(true);
    expect(runner.status().spawned).toBe(10);
    await stopAll(runner);
  });

  it("runs each kind on its own switch: load bots without the daily ones, and the other way round", async () => {
    vi.useFakeTimers();
    const { runner } = await loadRunner();
    await runner.setTarget(10);
    await runner.setLoadEnabled(true);
    expect(runner.status()).toMatchObject({ spawned: 10, running: true, dailyEnabled: false });
    expect(dailyState(runner)).toBe(BOT_STATE.stopped);

    await runner.setDailyEnabled(true);
    await runner.setLoadEnabled(false);
    expect(runner.status()).toMatchObject({ spawned: 0, running: true });
    expect(dailyState(runner)).toBe(BOT_STATE.sleeping);
    expect(runner.snapshotBots().filter((bot) => bot.state === BOT_STATE.stopped)).toHaveLength(30);

    await runner.setDailyEnabled(false);
    expect(runner.isRunning()).toBe(false);
    expect(runner.snapshotBots().every((bot) => bot.state === BOT_STATE.stopped)).toBe(true);
  });

  it("gives the place of a load bot turned off by hand to the next one", async () => {
    vi.useFakeTimers();
    const { runner } = await loadRunner();
    await runner.setTarget(10);
    await runner.setLoadEnabled(true);
    await runner.setBotsEnabled({ ids: ["load-0", "load-1", "load-2"], enabled: false });
    const up = runner.snapshotBots().filter((bot) => bot.state === BOT_STATE.sleeping);
    expect(up.map((bot) => bot.id)).not.toContain("load-0");
    expect(runner.snapshotBots().find((bot) => bot.id === "load-0")).toMatchObject({
      state: BOT_STATE.paused,
      enabled: false,
    });
    expect(runner.status().spawned).toBe(7);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(runner.status().spawned).toBe(10);
    await stopAll(runner);
  });

  it("the load switch, off then on, turns every load bot off then back on", async () => {
    vi.useFakeTimers();
    const { runner, saved } = await loadRunner();
    await runner.setTarget(10);
    await runner.setLoadEnabled(true);
    await runner.setBotsEnabled({ ids: ["load-0", "load-1", "bot-0"], enabled: false });

    await runner.setLoadEnabled(false);
    const load = () => runner.snapshotBots().filter((bot) => bot.kind === "load");
    expect(load().every((bot) => !bot.enabled)).toBe(true);
    expect(saved.at(-1)?.disabledBots).toEqual(["bot-0"]);

    await runner.setLoadEnabled(true);
    expect(load().every((bot) => bot.enabled)).toBe(true);
    expect(
      load()
        .filter((bot) => bot.state === BOT_STATE.sleeping)
        .map((bot) => bot.id),
    ).toContain("load-0");
    expect(runner.status().spawned).toBe(10);
    await stopAll(runner);
  });

  it("a bot turned on while its kind is off turns the kind on, with only that bot", async () => {
    vi.useFakeTimers();
    const { runner } = await loadRunner();
    await runner.setTarget(10);
    await runner.setBotsEnabled({ ids: ["load-4"], enabled: true });
    expect(runner.status()).toMatchObject({ loadEnabled: true, spawned: 1 });
    expect(
      runner
        .snapshotBots()
        .filter((bot) => bot.enabled)
        .map((bot) => bot.id),
    ).toEqual(["load-4"]);

    await runner.setBotsEnabled({ ids: ["bot-0"], enabled: true });
    expect(runner.status().dailyEnabled).toBe(true);
    expect(dailyState(runner)).toBe(BOT_STATE.sleeping);
    await stopAll(runner);
  });

  /** Load bots whose next visit falls within the coming quarter of an hour. */
  const visitingSoon = (runner: Runner) => {
    const soon = Date.now() + 15 * 60_000;
    return runner
      .snapshotBots()
      .filter((bot) => bot.kind === BOT_KIND.load && bot.nextWakeAt && new Date(bot.nextWakeAt).getTime() < soon);
  };

  it("a restart brings the load bots that were up back at once, on their usual pace (PFA-228)", async () => {
    vi.useFakeTimers({ now: new Date(Date.UTC(2026, 9, 12, 12, 0, 0)) });
    const runner = await fakeRunner({
      loadBots: 30,
      initialState: { disabledBots: [], disabledActions: [], loadEnabled: true, target: 30 },
      secretsPath: await secretsPath(),
    });
    runner.resume();
    expect(runner.status().spawned).toBe(30);
    // About one in 25 visits within a quarter of an hour on the daily pace, not all thirty.
    expect(visitingSoon(runner).length).toBeLessThan(6);
    await stopAll(runner);
  });

  it("back to the daily pace, the load bots up do not all visit in the next quarter (PFA-228)", async () => {
    vi.useFakeTimers({ now: new Date(Date.UTC(2026, 9, 12, 12, 0, 0)) });
    const { runner } = await loadRunner();
    await runner.setTarget(30);
    await runner.setLoadPace(LOAD_PACE.burst);
    await runner.setLoadEnabled(true);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(visitingSoon(runner)).toHaveLength(30);

    await runner.setLoadPace(LOAD_PACE.daily);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(visitingSoon(runner).length).toBeLessThan(6);
    await stopAll(runner);
  });

  it("keeps only the first maxBots load bots, and persists the pace", async () => {
    const saved: PersistedRunnerState[] = [];
    const runner = await fakeRunner({ loadBots: 30, maxBots: 12, saved, secretsPath: await secretsPath() });
    expect(runner.status().totalLoad).toBe(12);
    await runner.setLoadPace("burst");
    expect(runner.status().loadPace).toBe("burst");
    expect(saved.at(-1)?.loadPace).toBe("burst");
  });
});
