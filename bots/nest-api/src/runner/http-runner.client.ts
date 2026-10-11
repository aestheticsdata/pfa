import { BadGatewayException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";

import type {
  RunnerAction,
  RunnerActivityPoint,
  RunnerBot,
  RunnerBotDetail,
  RunnerBulkResult,
  RunnerQuietHours,
  RunnerQuietHoursInput,
  RunnerRamp,
  RunnerStatus,
  RunnerToggle,
} from "#app/runner/interfaces/runnerApiTypes.js";
import type { RunnerClient, RunnerEndpoint } from "#app/runner/interfaces/runnerClientTypes.js";

const TIMEOUT_MS = 8_000;
/** Closing an account waits on the app (a purge deletes a lot). */
const ACCOUNT_TIMEOUT_MS = 30_000;

/** The request one call makes. */
interface Call {
  method: string;
  path: string;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * The real runner: its control API on 127.0.0.1, Bearer token from the back-office's env. The
 * token never leaves this process — the browser only ever talks to the Next server.
 */
export class HttpRunnerClient implements RunnerClient {
  constructor(private readonly endpoint: RunnerEndpoint) {}

  status(): Promise<RunnerStatus> {
    return this.call({ method: "GET", path: "/status" });
  }

  history(): Promise<RunnerActivityPoint[]> {
    return this.call({ method: "GET", path: "/history" });
  }

  bots(): Promise<RunnerBot[]> {
    return this.call({ method: "GET", path: "/bots" });
  }

  async bot(id: string): Promise<RunnerBotDetail | null> {
    return this.orNull(this.call<RunnerBotDetail>({ method: "GET", path: `/bots/${encodeURIComponent(id)}` }));
  }

  actions(): Promise<RunnerAction[]> {
    return this.call({ method: "GET", path: "/actions" });
  }

  async setDaily(enabled: boolean): Promise<boolean> {
    return (await this.call<{ enabled: boolean }>({ method: "PUT", path: "/daily", body: { enabled } })).enabled;
  }

  async setTarget(target: number): Promise<number> {
    return (await this.call<{ target: number }>({ method: "PUT", path: "/target", body: { target } })).target;
  }

  setRamp(ramp: RunnerRamp): Promise<RunnerRamp> {
    return this.call({ method: "PUT", path: "/ramp", body: ramp });
  }

  async setLoad(enabled: boolean): Promise<boolean> {
    return (await this.call<{ enabled: boolean }>({ method: "PUT", path: "/load", body: { enabled } })).enabled;
  }

  async setLoadPace(pace: string): Promise<string> {
    return (await this.call<{ pace: string }>({ method: "PUT", path: "/load-pace", body: { pace } })).pace;
  }

  setQuietHours(hours: RunnerQuietHoursInput): Promise<RunnerQuietHours> {
    return this.call({ method: "PUT", path: "/quiet-hours", body: hours });
  }

  setBots(toggle: RunnerToggle): Promise<RunnerBulkResult> {
    return this.call({ method: "POST", path: "/bots/bulk", body: toggle });
  }

  async restartSession(id: string): Promise<boolean> {
    const path = `/bots/${encodeURIComponent(id)}/restart-session`;
    return (await this.orNull(this.call({ method: "POST", path }))) !== null;
  }

  async setAction(name: string, enabled: boolean): Promise<boolean> {
    const path = `/actions/${encodeURIComponent(name)}`;
    return (await this.orNull(this.call({ method: "PATCH", path, body: { enabled } }))) !== null;
  }

  async enableAllActions(): Promise<void> {
    await this.call({ method: "POST", path: "/actions/enable-all" });
  }

  async closeAccount(id: string, purge: boolean): Promise<boolean> {
    const path = `/accounts/${encodeURIComponent(id)}${purge ? "" : "/disable"}`;
    const call = { method: purge ? "DELETE" : "POST", path, timeoutMs: ACCOUNT_TIMEOUT_MS };
    return (await this.orNull(this.call(call))) !== null;
  }

  private async orNull<T>(pending: Promise<T>): Promise<T | null> {
    try {
      return await pending;
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }

  private async call<T>(call: Call): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.endpoint.url}${call.path}`, {
        method: call.method,
        headers: { authorization: `Bearer ${this.endpoint.token}`, "content-type": "application/json" },
        body: call.body === undefined ? undefined : JSON.stringify(call.body),
        signal: AbortSignal.timeout(call.timeoutMs ?? TIMEOUT_MS),
      });
    } catch {
      throw new ServiceUnavailableException("The runner is not answering", { errorCode: "RUNNER_UNREACHABLE" });
    }
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (res.status === 404) {
      throw new NotFoundException(body.error ?? "Not found");
    }
    if (!res.ok) {
      throw new BadGatewayException(body.error ?? `Runner answered ${res.status}`, { errorCode: "RUNNER_ERROR" });
    }
    return body;
  }
}
