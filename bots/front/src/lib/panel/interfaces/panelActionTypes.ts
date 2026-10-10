/** Turning bots on or off, one or many. */
export interface BotsToggle {
  app: string;
  ids: string[];
  enabled: boolean;
}

export interface ActionToggle {
  app: string;
  name: string;
  enabled: boolean;
}

export interface RampInput {
  app: string;
  step: number;
  everySec: number;
}

export interface QuietHoursInput {
  app: string;
  from: string;
  to: string;
}

export interface AccountClosureInput {
  app: string;
  bot: string;
  purge: boolean;
}

/** A browser's push subscription, as `PushSubscription.toJSON()` gives it. */
export interface PushSubscriptionJson {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
