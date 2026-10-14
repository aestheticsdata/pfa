import type { BotDetailView, SparkPoint } from "@contracts/interfaces/panelTypes";

export interface BotDrawerProps {
  app: string;
  bot: BotDetailView;
  /** Opened over a page in the app (close = back), or loaded directly (close = the Bots page). */
  intercepted: boolean;
}

export interface DrawerPartProps {
  app: string;
  bot: BotDetailView;
}

export interface DrawerCloseProps {
  onClose: () => void;
}

export interface DrawerHeaderProps extends DrawerPartProps, DrawerCloseProps {}

export interface KvCellProps {
  label: string;
  value: string;
  valueClass?: string;
}

export interface SparkColumnsProps {
  spark: SparkPoint[];
  ariaLabel: string;
  /** When the slice at `index` was, for its tooltip (`12s ago`, `3h ago`). */
  when: (index: number) => string;
}
