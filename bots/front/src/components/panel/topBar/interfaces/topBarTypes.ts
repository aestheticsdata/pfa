import type { AppSummary, PanelHeader } from "@contracts/interfaces/panelTypes";
import type { PanelView } from "@lib/panel/interfaces/panelRouteTypes";

/** One nav entry, with its count (Incidents counts in red). */
export interface NavItem {
  view: PanelView;
  label: string;
  count: string | null;
  alarm: boolean;
}

export interface TopBarProps {
  header: PanelHeader;
  email: string;
}

export interface AppSwitcherProps {
  app: AppSummary;
  apps: AppSummary[];
}

export interface NavTabsProps {
  app: string;
  items: NavItem[];
}

export interface StatusPillProps {
  running: boolean;
}

export interface UserMenuProps {
  email: string;
}

export interface MobileMenuProps {
  app: AppSummary;
  items: NavItem[];
  refreshedAt: string;
  email: string;
}

export interface NavCountProps {
  item: NavItem;
}
