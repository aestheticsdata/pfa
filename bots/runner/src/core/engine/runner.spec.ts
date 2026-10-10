import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOT_STATE } from "@core/constants/bot";
import { BotBlockedError } from "@core/engine/errors";
import { fakeRunner } from "@core/testing/fakeRunner";
import { describe, expect, it } from "vitest";

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

  it("is stopped by default, and persists the kill switch", async () => {
    const saved: PersistedRunnerState[] = [];
    const runner = await fakeRunner({ saved, secretsPath: await secretsPath() });
    expect(runner.isRunning()).toBe(false);
    expect(runner.snapshotBots()[0]?.state).toBe(BOT_STATE.stopped);
    await runner.start();
    await runner.stop();
    expect(saved.map((state) => state.running)).toEqual([true, false]);
  });

  it("never picks a disabled action, and stops a visit when the kill switch is off", async () => {
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
