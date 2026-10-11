import { SimulatedRunnerClient } from "#app/mock/simulated-runner.client.js";

describe("SimulatedRunnerClient", () => {
  it("boots the same run for the same seed — every take of the film alike", async () => {
    const a = await new SimulatedRunnerClient({ seed: 1991, populated: true }).bots();
    const b = await new SimulatedRunnerClient({ seed: 1991, populated: true }).bots();
    expect(a.map((bot) => [bot.id, bot.totalActions, bot.errors])).toEqual(
      b.map((bot) => [bot.id, bot.totalActions, bot.errors]),
    );
  });

  it("has 4 daily bots and 120 load bots, 84 of them up, and an empty second app", async () => {
    const status = await new SimulatedRunnerClient({ seed: 1991, populated: true }).status();
    expect(status).toMatchObject({ totalDaily: 4, totalLoad: 120, target: 120, spawned: 84, running: true });
    const empty = await new SimulatedRunnerClient({ seed: 7, populated: false }).status();
    expect(empty).toMatchObject({ totalDaily: 0, totalLoad: 0, running: false });
  });

  it("caps the target at 500, queues the bots above it, and blocks a closed account", async () => {
    const runner = new SimulatedRunnerClient({ seed: 1, populated: true });
    expect(await runner.setTarget(900)).toBe(500);
    expect((await runner.status()).totalLoad).toBe(500);
    expect(await runner.closeAccount("ceres")).toBe(true);
    expect((await runner.bot("ceres"))?.state).toBe("blocked");
  });

  it("charts the last 24 h, one point an hour, for the fleet and for each bot", async () => {
    const runner = new SimulatedRunnerClient({ seed: 1991, populated: true });
    const day = await runner.dayHistory();
    expect(day).toHaveLength(24);
    expect(day.reduce((sum, point) => sum + point.actions, 0)).toBeGreaterThan(0);
    expect((await runner.bot("ceres"))?.daySpark).toHaveLength(24);
  });

  it("runs each kind on its own switch, and ignores a load bot's own toggle", async () => {
    const runner = new SimulatedRunnerClient({ seed: 1, populated: true });
    expect(await runner.setDaily(false)).toBe(false);
    expect(await runner.status()).toMatchObject({ running: true, dailyEnabled: false, liveDaily: 0 });
    await runner.setBots({ ids: ["legionary-001"], enabled: false });
    expect(await runner.bot("legionary-001")).toMatchObject({ enabled: true });
    expect((await runner.bot("legionary-001"))?.state).not.toBe("paused");
    await runner.setLoad(false);
    expect(await runner.status()).toMatchObject({ running: false, liveLoad: 0 });
  });
});
