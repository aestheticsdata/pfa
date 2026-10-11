import { createControlServer } from "@core/control/controlServer";
import { fakeRunner } from "@core/testing/fakeRunner";
import { afterEach, describe, expect, it } from "vitest";

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { FakeRunnerOptions } from "@core/testing/interfaces/fakeRunnerTypes";

const TOKEN = "s".repeat(40);
let server: Server | undefined;

async function start(options: FakeRunnerOptions = {}): Promise<string> {
  const created = createControlServer({ runner: await fakeRunner(options), token: TOKEN });
  server = created;
  await new Promise<void>((resolve) => created.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(created.address() as AddressInfo).port}`;
}

const auth = { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" };

afterEach(() => {
  server?.close();
});

describe("control API", () => {
  it("refuses every route without the token, or with a wrong one", async () => {
    const base = await start();
    for (const path of ["/status", "/bots", "/actions", "/limits", "/upload-budget"]) {
      expect((await fetch(`${base}${path}`)).status).toBe(401);
      expect((await fetch(`${base}${path}`, { headers: { authorization: "Bearer nope" } })).status).toBe(401);
    }
    const daily = await fetch(`${base}/daily`, { method: "PUT", body: JSON.stringify({ enabled: true }) });
    expect(daily.status).toBe(401);
  });

  it("answers Zeus's health probe without the token", async () => {
    const base = await start();
    const health = await fetch(`${base}/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: "ok" });
  });

  it("serves the status and flips the daily switch with the token", async () => {
    const base = await start();
    const status = await (await fetch(`${base}/status`, { headers: auth })).json();
    expect(status).toMatchObject({ running: false, dailyEnabled: false });

    const started = await fetch(`${base}/daily`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ enabled: true }),
    });
    expect(await started.json()).toEqual({ enabled: true });
    expect(await (await fetch(`${base}/status`, { headers: auth })).json()).toMatchObject({ running: true });
    const stopped = await fetch(`${base}/daily`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ enabled: false }),
    });
    expect(await stopped.json()).toEqual({ enabled: false });
  });

  it("validates bodies and unknown targets", async () => {
    const base = await start();
    const bad = await fetch(`${base}/daily`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ enabled: "yes" }),
    });
    expect(bad.status).toBe(400);
    const unknown = await fetch(`${base}/bots/ghost`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ enabled: false }),
    });
    expect(unknown.status).toBe(404);
    const paused = await fetch(`${base}/bots/bot-0`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ enabled: false }),
    });
    expect(paused.status).toBe(200);
  });

  it("serves the back-office's reads: history, one bot's detail, actions", async () => {
    const base = await start();
    const history = await (await fetch(`${base}/history`, { headers: auth })).json();
    expect(history).toHaveLength(80);
    expect(history[0]).toMatchObject({ actions: 0, p50: 0, codes2xx: 0 });
    const detail = await (await fetch(`${base}/bots/bot-0`, { headers: auth })).json();
    expect(detail).toMatchObject({ id: "bot-0", byAction: {}, recentRequests: [] });
    expect(detail.spark).toHaveLength(15);
    expect((await fetch(`${base}/bots/ghost`, { headers: auth })).status).toBe(404);
  });

  it("switches the load bots and sets their pace, validated", async () => {
    const base = await start({ loadBots: 3 });
    const put = (path: string, body: unknown) =>
      fetch(`${base}${path}`, { method: "PUT", headers: auth, body: JSON.stringify(body) });
    expect(await (await put("/load", { enabled: true })).json()).toEqual({ enabled: true });
    expect((await put("/load", { enabled: "yes" })).status).toBe(400);
    expect(await (await put("/load-pace", { pace: "burst" })).json()).toEqual({ pace: "burst" });
    expect((await put("/load-pace", { pace: "frenzy" })).status).toBe(400);
    const status = await (await fetch(`${base}/status`, { headers: auth })).json();
    expect(status).toMatchObject({ loadEnabled: true, loadPace: "burst", totalLoad: 3, maxActiveVisits: 50 });
  });

  it("clamps the load target to the hard cap and validates ramp and quiet hours", async () => {
    const base = await start({ maxBots: 500 });
    const put = (path: string, body: unknown) =>
      fetch(`${base}${path}`, { method: "PUT", headers: auth, body: JSON.stringify(body) });
    expect(await (await put("/target", { target: 9999 })).json()).toEqual({ target: 500 });
    expect((await put("/target", { target: -1 })).status).toBe(400);
    expect(await (await put("/ramp", { step: 25, everySec: 60 })).json()).toEqual({ step: 25, everySec: 60 });
    expect((await put("/quiet-hours", { from: "22:00", to: "22:00" })).status).toBe(400);
    expect((await put("/quiet-hours", { from: "25:00", to: "10:00" })).status).toBe(400);
    const quiet = await (await put("/quiet-hours", { from: "23:00", to: "09:00" })).json();
    expect(quiet).toMatchObject({ from: "23:00", to: "09:00", tz: "Europe/Paris" });
    const status = await (await fetch(`${base}/status`, { headers: auth })).json();
    expect(status).toMatchObject({ target: 500, ramp: { step: 25, everySec: 60 } });
  });

  it("toggles bots in bulk and restarts a session", async () => {
    const base = await start({ emails: ["a@synthetic.test", "b@synthetic.test"] });
    const bulk = await fetch(`${base}/bots/bulk`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ ids: ["bot-0", "bot-1", "ghost"], enabled: false }),
    });
    expect(await bulk.json()).toEqual({ updated: ["bot-0", "bot-1"], unknown: ["ghost"] });
    const bots = await (await fetch(`${base}/bots`, { headers: auth })).json();
    expect(bots.map((bot: { enabled: boolean }) => bot.enabled)).toEqual([false, false]);
    const restart = await fetch(`${base}/bots/bot-0/restart-session`, { method: "POST", headers: auth });
    expect(restart.status).toBe(200);
  });

  it("disables or purges an account through the app, then blocks the bot for good", async () => {
    const calls: string[] = [];
    const base = await start({
      accounts: {
        disable: async (bot) => {
          calls.push(`disable ${bot.email}`);
        },
        purge: async (bot) => {
          calls.push(`purge ${bot.email}`);
        },
      },
    });
    const disabled = await fetch(`${base}/accounts/bot-0/disable`, { method: "POST", headers: auth });
    expect(await disabled.json()).toEqual({ bot: "bot-0", result: "disabled" });
    const purged = await fetch(`${base}/accounts/bot-0`, { method: "DELETE", headers: auth });
    expect(await purged.json()).toEqual({ bot: "bot-0", result: "purged" });
    expect(calls).toEqual(["disable bot@synthetic.test", "purge bot@synthetic.test"]);
    const bots = await (await fetch(`${base}/bots`, { headers: auth })).json();
    expect(bots[0].state).toBe("blocked");
    expect((await fetch(`${base}/accounts/ghost/disable`, { method: "POST", headers: auth })).status).toBe(404);
  });

  it("says when the app refuses, and when it cannot close accounts at all", async () => {
    const refusing = await start({
      accounts: {
        disable: async () => {
          throw new Error("HTTP 500");
        },
        purge: async () => {},
      },
    });
    expect((await fetch(`${refusing}/accounts/bot-0/disable`, { method: "POST", headers: auth })).status).toBe(502);
    server?.close();
    const without = await start();
    expect((await fetch(`${without}/accounts/bot-0/disable`, { method: "POST", headers: auth })).status).toBe(502);
  });
});
