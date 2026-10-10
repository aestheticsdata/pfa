/** Every change the panel can make to a runner; also the audit log's `action` for it. */
export const CONTROL_ACTION = {
  runnerSet: "runner.set",
  targetSet: "target.set",
  rampSet: "ramp.set",
  quietHoursSet: "quiet-hours.set",
  botsToggle: "bots.toggle",
  botRestartSession: "bot.restart-session",
  actionToggle: "action.toggle",
  actionsEnableAll: "actions.enable-all",
} as const;
