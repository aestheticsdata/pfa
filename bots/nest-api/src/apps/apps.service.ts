import { readFileSync } from "node:fs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { appsFileSchema } from "#app/apps/apps.schemas.js";
import { BOTS_MODE } from "#app/config/app.config.js";
import { SimulatedRunnerClient } from "#app/mock/simulated-runner.client.js";
import { HttpRunnerClient } from "#app/runner/http-runner.client.js";

import type { AppEntry } from "#app/apps/interfaces/appTypes.js";
import type { AppConfig } from "#app/config/interfaces/configTypes.js";

const MIN_TOKEN_LENGTH = 32;

/**
 * The apps the back-office drives, read once at boot. Live mode: `config/apps.json`, every runner
 * token from the environment (refusing to boot without one). Mock mode: PFA on a simulated runner
 * plus an empty second app, so the picker and the theme fallback have something to show.
 */
@Injectable()
export class AppsService {
  private readonly apps: AppEntry[];

  constructor(config: ConfigService) {
    const app = config.getOrThrow<AppConfig>("app");
    this.apps = app.mode === BOTS_MODE.mock ? mockApps() : liveApps(app.appsFile);
  }

  list(): AppEntry[] {
    return this.apps;
  }

  get(id: string): AppEntry {
    const app = this.apps.find((candidate) => candidate.id === id);
    if (!app) {
      throw new NotFoundException("Unknown app", { errorCode: "APP_UNKNOWN" });
    }
    return app;
  }
}

function liveApps(file: string): AppEntry[] {
  const entries = appsFileSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  return entries.map((entry) => {
    const token = process.env[entry.runner.tokenEnv] ?? "";
    if (token.length < MIN_TOKEN_LENGTH) {
      throw new Error(`${entry.runner.tokenEnv} must hold ${entry.id}'s runner token (${MIN_TOKEN_LENGTH}+ chars)`);
    }
    return {
      id: entry.id,
      name: entry.name,
      host: entry.host,
      address: new URL(entry.runner.url).host,
      theme: entry.theme,
      timeZone: entry.timeZone,
      runner: new HttpRunnerClient({ url: entry.runner.url, token }),
      alertLogs: entry.alertLogs,
      allowedIps: entry.allowedIps,
    };
  });
}

function mockApps(): AppEntry[] {
  return [
    {
      id: "pfa",
      name: "pfa",
      host: "ks-b",
      address: "127.0.0.1:7300",
      theme: "pfa",
      timeZone: "Europe/Paris",
      runner: new SimulatedRunnerClient({ seed: 1991, populated: true }),
      alertLogs: null,
      allowedIps: "203.0.113.10",
    },
    {
      id: "sample-app",
      name: "sample-app",
      host: "ks-c",
      address: "127.0.0.1:9472",
      theme: null,
      timeZone: "Europe/Paris",
      runner: new SimulatedRunnerClient({ seed: 7, populated: false }),
      alertLogs: null,
      allowedIps: null,
    },
  ];
}
