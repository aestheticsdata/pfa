import type { Runner } from "@core/engine/runner";

export interface ControlServerOptions<TPersona = unknown> {
  runner: Runner<TPersona>;
  token: string;
}
