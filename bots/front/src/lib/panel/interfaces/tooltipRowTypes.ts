import type { ActivityPoint } from "@contracts/interfaces/panelTypes";

/** A day-chart slice and the registry's action names (their colours). */
export interface SliceActionsQuery {
  point: ActivityPoint;
  actionNames: string[];
}
