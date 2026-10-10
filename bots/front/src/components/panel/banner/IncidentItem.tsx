import FieldBlock from "@components/panel/banner/FieldBlock";
import IncidentActions from "@components/panel/banner/IncidentActions";
import LocalTime from "@components/ui/LocalTime";
import Tag from "@components/ui/Tag";
import { ago } from "@lib/format/format";
import { PANEL_TEXT } from "@text/panel";

import type { IncidentItemProps } from "@components/panel/banner/interfaces/bannerTypes";

/**
 * One open incident. ≥ 700px: account · source · attempts · last seen · actions (2 × 2 on a
 * tablet, actions on their own row); phone: a compact block (handoff `.inc-m`).
 */
const IncidentItem = ({ app, incident, now }: IncidentItemProps) => {
  const kind = incident.kind ?? PANEL_TEXT.banner.unknownKind;
  const who = [incident.userId ?? incident.botId, incident.path].filter(Boolean).join(" · ");
  const seen = `${ago(incident.lastSeenAt, now)}${incident.pushed ? ` · ${PANEL_TEXT.banner.push}` : ""}`;
  return (
    <div
      className="border-t border-bad/25 px-3.5 py-2.25 text-body"
      data-testid="incident-row"
    >
      <div className="flex flex-col gap-0.5 tablet:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-mono font-medium">{incident.account}</span>
          <Tag>{kind}</Tag>
        </div>
        <p className="m-0 truncate font-mono text-mini text-badtx">
          {incident.ip} · {PANEL_TEXT.banner.attemptsShort(incident.attempts)} · {ago(incident.lastSeenAt, now)}
        </p>
        <IncidentActions
          app={app}
          incident={incident}
          compact
        />
      </div>
      <div className="hidden items-center gap-4 tablet:grid tablet:grid-cols-2 desktop:grid-cols-(--grid-incident)">
        <FieldBlock
          label={`${PANEL_TEXT.banner.account} · ${kind}`}
          value={incident.account}
          title={incident.account}
          sub={who || undefined}
        />
        <FieldBlock
          label={PANEL_TEXT.banner.sourceIp}
          value={incident.ip}
          title={incident.ip}
          sub={incident.userAgent ?? undefined}
        />
        <FieldBlock
          label={PANEL_TEXT.banner.attempts}
          value={String(incident.attempts)}
          big
        />
        <FieldBlock
          label={PANEL_TEXT.banner.lastSeen}
          value={<LocalTime iso={incident.lastSeenAt} />}
          sub={seen}
        />
        <div className="col-span-full desktop:col-auto">
          <IncidentActions
            app={app}
            incident={incident}
          />
        </div>
      </div>
    </div>
  );
};

export default IncidentItem;
