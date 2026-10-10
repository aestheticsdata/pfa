import { resolve } from "node:path";

import type { RunnerConfig } from "@core/interfaces/configTypes";

const MIN_TOKEN_LENGTH = 32;

/** A cap read from the environment: lowered at will, never raised above `max`. */
interface CapSetting {
  raw: string | undefined;
  fallback: number;
  max: number;
}
const MB = 1024 * 1024;

/**
 * Everything security-relevant comes from the environment and is validated once at boot: a runner
 * with a weak token, no token, or caps out of range refuses to start rather than run unguarded.
 */
export function loadRunnerConfig(env: NodeJS.ProcessEnv): RunnerConfig {
  const controlToken = env.RUNNER_CONTROL_TOKEN ?? "";
  if (controlToken.length < MIN_TOKEN_LENGTH) {
    throw new Error(`RUNNER_CONTROL_TOKEN must be set, ${MIN_TOKEN_LENGTH} characters at least`);
  }
  return {
    // Loopback only: the control API is never reachable from outside the machine.
    controlHost: "127.0.0.1",
    controlPort: positiveInt(env.RUNNER_CONTROL_PORT, 9471),
    controlToken,
    stateDir: resolve(env.RUNNER_STATE_DIR ?? ".runner-state"),
    limits: {
      maxBots: boundedInt({ raw: env.RUNNER_MAX_BOTS, fallback: 500, max: 500 }),
      maxRps: boundedInt({ raw: env.RUNNER_MAX_RPS, fallback: 40, max: 200 }),
      uploadBudgetBytes: boundedInt({ raw: env.RUNNER_UPLOAD_BUDGET_MB, fallback: 400, max: 400 }) * MB,
      uploadWindowDays: 365,
    },
  };
}

function positiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected a positive integer, got "${raw}"`);
  }
  return value;
}

/** A positive integer that can be lowered by config but never raised above the hard ceiling. */
function boundedInt(bound: CapSetting): number {
  const value = positiveInt(bound.raw, bound.fallback);
  if (value > bound.max) {
    throw new Error(`${value} is above the hard cap of ${bound.max}`);
  }
  return value;
}
