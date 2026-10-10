import { createControlServer } from "@core/control/controlServer";
import { fakeRunner } from "@core/testing/fakeRunner";
import { afterEach, describe, expect, it } from "vitest";

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

const TOKEN = "s".repeat(40);
let server: Server | undefined;

async function start(): Promise<string> {
  const created = createControlServer({ runner: await fakeRunner(), token: TOKEN });
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
    const kill = await fetch(`${base}/runner`, { method: "POST", body: JSON.stringify({ running: true }) });
    expect(kill.status).toBe(401);
  });

  it("serves the status and flips the kill switch with the token", async () => {
    const base = await start();
    const status = await (await fetch(`${base}/status`, { headers: auth })).json();
    expect(status.running).toBe(false);

    const started = await fetch(`${base}/runner`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ running: true }),
    });
    expect((await started.json()).running).toBe(true);
    const stopped = await fetch(`${base}/runner`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ running: false }),
    });
    expect((await stopped.json()).running).toBe(false);
  });

  it("validates bodies and unknown targets", async () => {
    const base = await start();
    const bad = await fetch(`${base}/runner`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ running: "yes" }),
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
});
