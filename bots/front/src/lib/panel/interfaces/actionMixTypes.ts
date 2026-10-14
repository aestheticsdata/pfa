import type { ActionView } from "@contracts/interfaces/panelTypes";

/** An action of the mix, as its legend, tooltip and detail read it. */
export interface MixEntry {
  name: string;
  count: number;
  color: string;
  /** Its share of every run since the runner started, in %. */
  share: number;
  /** The registry's view of it; undefined for a name the registry no longer has. */
  action: ActionView | undefined;
}
