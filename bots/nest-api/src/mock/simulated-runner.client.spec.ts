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

  it("charts the last 24 h every 15 min by action for the fleet, and each bot's by the hour", async () => {
    const runner = new SimulatedRunnerClient({ seed: 1991, populated: true });
    const day = await runner.dayHistory();
    expect(day).toHaveLength(96);
    const busy = day.find((point) => point.actions > 0);
    expect(Object.values(busy?.byAction ?? {}).reduce((sum, n) => sum + n, 0)).toBe(busy?.actions);
    expect(Object.keys(busy?.byBot ?? {}).length).toBeGreaterThan(0);
    expect(day.reduce((sum, point) => sum + point.actions, 0)).toBeGreaterThan(0);
    expect((await runner.bot("ceres"))?.daySpark).toHaveLength(24);
  });

  it("runs each kind on its own switch, and a load bot turned off gives its place to the next", async () => {
    const runner = new SimulatedRunnerClient({ seed: 1, populated: true });
    expect(await runner.setDaily(false)).toBe(false);
    expect(await runner.status()).toMatchObject({ running: true, dailyEnabled: false, liveDaily: 0 });
    const liveLoad = (await runner.status()).liveLoad;
    await runner.setBots({ ids: ["legionary-001"], enabled: false });
    expect(await runner.bot("legionary-001")).toMatchObject({ enabled: false, state: "paused" });
    expect((await runner.status()).liveLoad).toBe(liveLoad);
    await runner.setLoad(false);
    expect(await runner.status()).toMatchObject({ running: false, liveLoad: 0 });
  });

  it("a kind's switch, off then on, turns all its bots off then back on", async () => {
    const runner = new SimulatedRunnerClient({ seed: 1, populated: true });
    await runner.setBots({ ids: ["legionary-001", "legionary-002"], enabled: false });
    await runner.setLoad(false);
    expect((await runner.bots()).filter((bot) => bot.kind === "load").every((bot) => !bot.enabled)).toBe(true);
    await runner.setLoad(true);
    expect((await runner.bots()).filter((bot) => bot.kind === "load").every((bot) => bot.enabled)).toBe(true);
  });
});
