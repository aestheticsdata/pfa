import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOT_STATE } from "@core/constants/bot";
import { BotBlockedError } from "@core/engine/errors";
import { fakeRunner } from "@core/testing/fakeRunner";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Runner } from "@core/engine/runner";
import type { BotAction } from "@core/interfaces/actionTypes";
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
    await runner.setBotsEnabled({ ids: ["load-0", "load-1", "load-2"], enabled: false });
    await runner.setTarget(10);
    await runner.setLoadEnabled(true);
    const up = runner.snapshotBots().filter((bot) => bot.state === BOT_STATE.sleeping);
    expect(up.map((bot) => bot.id)).not.toContain("load-0");
    expect(up).toHaveLength(10);
    expect(runner.snapshotBots().find((bot) => bot.id === "load-0")?.state).toBe(BOT_STATE.paused);

    await runner.setBotsEnabled({ ids: ["load-3"], enabled: false });
    expect(runner.status().spawned).toBe(9);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(runner.status().spawned).toBe(10);
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
