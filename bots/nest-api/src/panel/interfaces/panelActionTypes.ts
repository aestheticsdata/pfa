import type { AuditActor } from "#app/audit/interfaces/auditTypes.js";
import type { CONTROL_ACTION } from "#app/panel/panel-actions.js";
import type { RunnerQuietHoursInput, RunnerRamp, RunnerToggle } from "#app/runner/interfaces/runnerApiTypes.js";

export type ControlAction =
  | { kind: typeof CONTROL_ACTION.runnerSet; running: boolean }
  | { kind: typeof CONTROL_ACTION.targetSet; target: number }
  | { kind: typeof CONTROL_ACTION.rampSet; ramp: RunnerRamp }
  | { kind: typeof CONTROL_ACTION.loadSet; enabled: boolean }
  | { kind: typeof CONTROL_ACTION.loadPaceSet; pace: string }
  | { kind: typeof CONTROL_ACTION.quietHoursSet; hours: RunnerQuietHoursInput }
  | { kind: typeof CONTROL_ACTION.botsToggle; toggle: RunnerToggle }
  | { kind: typeof CONTROL_ACTION.botRestartSession; botId: string }
  | { kind: typeof CONTROL_ACTION.actionToggle; name: string; enabled: boolean }
  | { kind: typeof CONTROL_ACTION.actionsEnableAll };

/** One change, on one app, by someone. */
export interface PanelChange {
  app: string;
  actor: AuditActor;
  action: ControlAction;
}

/** "Disable / purge account" on one bot. */
export interface AccountClosure {
  app: string;
  botId: string;
  purge: boolean;
  actor: AuditActor;
}
