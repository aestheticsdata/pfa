import AppLogo from "@components/brand/AppLogo";
import Dot from "@components/ui/Dot";
import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { appPath } from "@lib/panel/routes";
import { PANEL_VIEW } from "@lib/panel/views";
import { PANEL_TEXT } from "@text/panel";
import Link from "next/link";

import type { AppCardProps } from "@components/panel/picker/interfaces/pickerTypes";

/** One app: logo, name, `host · address`, live bots, incidents. */
const AppCard = ({ app }: AppCardProps) => (
  <Link
    href={appPath(app.id, PANEL_VIEW.overview)}
    data-testid={`app-card-${app.id}`}
    className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-panel px-4.5 py-4 text-text no-underline shadow-auth hover:bg-okbg"
  >
    <AppLogo
      app={app}
      size={40}
    />
    <div className="min-w-0 flex-1">
      <div className="text-title font-semibold">{app.name}</div>
      <div className="font-mono text-xs text-dim">
        {app.host} · {app.address}
      </div>
    </div>
    <div className="flex items-center gap-3 text-note text-muted">
      <span className="flex items-center gap-1.5 font-mono">
        <Dot tone={app.running ? TONE.ok : TONE.neutral} />
        {app.reachable ? `${app.liveBots} ${PANEL_TEXT.picker.liveBots}` : PANEL_TEXT.picker.unreachable}
      </span>
      {app.openIncidents > 0 ? (
        <Tag tone={TONE.bad}>{PANEL_TEXT.picker.incidents(app.openIncidents)}</Tag>
      ) : (
        <Tag>{PANEL_TEXT.picker.noIncidents}</Tag>
      )}
    </div>
  </Link>
);

export default AppCard;
