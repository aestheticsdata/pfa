import { actionColor } from "@lib/panel/actionColors";

import type { ActionCount, ActionView } from "@contracts/interfaces/panelTypes";
import type { MixEntry } from "@lib/panel/interfaces/actionMixTypes";

/** The mix's entries: the actions that ran, busiest first, with their colour, share and registry view. */
export function mixEntries(runs: ActionCount[], actions: ActionView[]): MixEntry[] {
  const names = runs.map((entry) => entry.name);
  const total = runs.reduce((sum, entry) => sum + entry.count, 0) || 1;
  return runs
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((entry) => ({
      name: entry.name,
      count: entry.count,
      color: actionColor(names, entry.name),
      share: Math.round((entry.count / total) * 100),
      action: actions.find((action) => action.name === entry.name),
    }));
}
