import { PANEL_TEXT } from "@text/panel";

import type { PanelFooterProps } from "@components/panel/shared/interfaces/footerTypes";

const PanelFooter = ({ allowedIps }: PanelFooterProps) => (
  <footer className="mt-7 flex flex-wrap gap-x-4 gap-y-3 font-mono text-xs text-dim">
    {allowedIps && <span>{PANEL_TEXT.footer.allowed(allowedIps)}</span>}
    <span>{PANEL_TEXT.footer.push}</span>
  </footer>
);

export default PanelFooter;
