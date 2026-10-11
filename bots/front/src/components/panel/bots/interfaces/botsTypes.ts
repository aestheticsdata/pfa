import type { BotsPage, BotView } from "@contracts/interfaces/panelTypes";

/** The Bots page's filters, as in its URL. */
export interface BotsFilters {
  population: string;
  state: string;
  q: string;
  page: number;
}

export interface BotsCardProps {
  app: string;
  data: BotsPage;
  filters: BotsFilters;
  /** The bot whose drawer is open over the page. */
  focused?: string | null;
}

export interface BotRowsProps {
  app: string;
  rows: BotView[];
  /** The bot whose drawer is open: its row gets the focus outline. */
  focused: string | null;
}

/** The table and the phone list: the page's rows, plus every matching id for "select all". */
export interface BotsTableProps extends BotRowsProps {
  ids: string[];
}

export interface BotRowProps {
  app: string;
  bot: BotView;
  focused: boolean;
}

/** The table charts the last 24 h in daily pace, the last 30 s in burst (PFA-204). */
export interface BotsGridProps extends BotsTableProps {
  day: boolean;
}

export interface BotTableRowProps extends BotRowProps {
  day: boolean;
}

export interface ToolbarProps {
  app: string;
  data: BotsPage;
  filters: BotsFilters;
}

export interface PagerProps {
  app: string;
  data: BotsPage;
  filters: BotsFilters;
}

export interface BulkBarProps {
  app: string;
}

export interface SelectAllProps {
  ids: string[];
}

export interface SparklineProps {
  bot: BotView;
  /** The last 24 h (1 bar an hour) rather than the last 30 s. */
  day: boolean;
}

export interface StatusLabelProps {
  state: string;
}

export interface KindTagProps {
  kind: string;
}

export interface SelectionState {
  selected: string[];
  toggle: (id: string) => void;
  setAll: (ids: string[], on: boolean) => void;
  clear: () => void;
}

/** The bot toggled from a row's switch. */
export interface BotSwitchProps {
  app: string;
  bot: BotView;
}
