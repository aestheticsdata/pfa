import { PANEL_VIEW } from "@lib/panel/views";
import { PANEL_TEXT } from "@text/panel";

import type { NavItem } from "@components/panel/topBar/interfaces/topBarTypes";
import type { PanelHeader } from "@contracts/interfaces/panelTypes";

/** Overview · Bots `n` · Metrics · Actions `on/total` · Incidents `open` (only when > 0, in red). */
export function navItems(header: PanelHeader): NavItem[] {
  const open = header.incidents.length;
  return [
    { view: PANEL_VIEW.overview, label: PANEL_TEXT.nav.overview, count: null, alarm: false },
    { view: PANEL_VIEW.bots, label: PANEL_TEXT.nav.bots, count: String(header.botCount), alarm: false },
    { view: PANEL_VIEW.metrics, label: PANEL_TEXT.nav.metrics, count: null, alarm: false },
    {
      view: PANEL_VIEW.actions,
      label: PANEL_TEXT.nav.actions,
      count: `${header.actionsOn}/${header.actionsTotal}`,
      alarm: false,
    },
    {
      view: PANEL_VIEW.incidents,
      label: PANEL_TEXT.nav.incidents,
      count: open > 0 ? String(open) : null,
      alarm: open > 0,
    },
  ];
}
