import type { RunnerLimits } from "@core/interfaces/limitTypes";

export interface RunnerConfig {
  controlHost: string;
  controlPort: number;
  controlToken: string;
  stateDir: string;
  limits: RunnerLimits;
}
