import type { TooltipRow } from "@components/ui/interfaces/uiTypes";
import type { ActivityPoint } from "@contracts/interfaces/panelTypes";
import type { ReactNode } from "react";

export interface SliceDetailModalProps {
  app: string;
  /** The slice shown; undefined once it has slid out of the window. */
  point: ActivityPoint | undefined;
  /** How long a slice lasts: 15 min in daily pace, 1 s in burst (`SLICE_SECONDS`). */
  seconds: number;
  actionNames: string[];
  dailyIds: string[];
  open: boolean;
  onClose: () => void;
}

export interface SlicePartProps {
  point: ActivityPoint;
}

export interface SliceActionsProps {
  point: ActivityPoint;
  actionNames: string[];
}

export interface SliceBotsProps {
  app: string;
  point: ActivityPoint;
  dailyIds: string[];
  /** Following a bot's link closes the modal. */
  onLeave: () => void;
}

export interface SliceSectionProps {
  title: string;
  /** The mono note on the right of the title (a count). */
  aside?: ReactNode;
  children: ReactNode;
}

export interface SliceTooltipProps {
  title: string;
  point: ActivityPoint;
  seconds: number;
  rows: TooltipRow[];
}
