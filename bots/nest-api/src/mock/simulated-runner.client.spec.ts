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

  it("runs each kind on its own switch, and a load bot turned off gives its place to the next", async () => {
    const runner = new SimulatedRunnerClient({ seed: 1, populated: true });
    expect(await runner.setDaily(false)).toBe(false);
    expect(await runner.status()).toMatchObject({ running: true, dailyEnabled: false, liveDaily: 0 });
    const liveLoad = (await runner.status()).liveLoad;
    await runner.setBots({ ids: ["legionary-001"], enabled: false });
    expect((await runner.bot("legionary-001"))?.state).toBe("paused");
    expect((await runner.status()).liveLoad).toBe(liveLoad);
    await runner.setLoad(false);
    expect(await runner.status()).toMatchObject({ running: false, liveLoad: 0 });
  });
});
