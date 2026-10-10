import IncidentStatusTag from "@components/panel/incidents/IncidentStatusTag";
import Card from "@components/ui/Card";
import CardHeader from "@components/ui/CardHeader";
import LocalTime from "@components/ui/LocalTime";
import { TIME_FORMAT } from "@components/ui/timeFormat";
import { INCIDENT_STATUS } from "@contracts/panel";
import { cx } from "@lib/classNames/cx";
import { INCIDENTS_TEXT } from "@text/metrics";

import type { IncidentsCardProps } from "@components/panel/incidents/interfaces/incidentsTypes";
import type { IncidentRow } from "@contracts/interfaces/panelTypes";

const HEAD =
  "whitespace-nowrap border-b border-line-soft px-2.5 py-2 text-left text-tiny font-medium uppercase tracking-th text-dim first:pl-3.5 last:pr-3.5";
const CELL = "border-b border-line-soft px-2.5 py-1.5 align-middle font-mono text-note first:pl-3.5 last:pr-3.5";

/** Open ones on the clock (today), closed ones with their date. */
const when = (incident: IncidentRow) => (
  <LocalTime
    iso={incident.lastSeenAt}
    format={incident.status === INCIDENT_STATUS.open ? TIME_FORMAT.clock : TIME_FORMAT.day}
  />
);

/** Every `synthetic-foreign-ip` incident, open first. A table from 700px, rows below. */
const IncidentsCard = ({ view }: IncidentsCardProps) => {
  const rows = [...view.open, ...view.history];
  const c = INCIDENTS_TEXT.columns;
  return (
    <Card
      className="mt-4"
      testId="incidents-card"
    >
      <CardHeader
        title={INCIDENTS_TEXT.title}
        sub={INCIDENTS_TEXT.sub}
      />
      {rows.length === 0 && <p className="m-0 px-3.5 py-5.5 text-center text-body text-dim">{INCIDENTS_TEXT.none}</p>}
      <div className={cx("mt-2.5 hidden overflow-x-auto tablet:block", rows.length === 0 && "tablet:hidden")}>
        <table className="w-full border-collapse [&_tbody_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              <th className={HEAD}>{c.last}</th>
              <th className={HEAD}>{c.account}</th>
              <th className={HEAD}>{c.ip}</th>
              <th className={cx(HEAD, "text-right")}>{c.attempts}</th>
              <th className={HEAD}>{c.status}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((incident) => (
              <tr
                key={incident.id}
                className={incident.status === INCIDENT_STATUS.open ? undefined : "text-muted"}
              >
                <td className={CELL}>{when(incident)}</td>
                <td className={CELL}>{incident.account}</td>
                <td className={CELL}>{incident.ip}</td>
                <td className={cx(CELL, "text-right")}>{incident.attempts}</td>
                <td className={CELL}>
                  <IncidentStatusTag incident={incident} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 tablet:hidden">
        {rows.map((incident) => (
          <div
            key={incident.id}
            className="grid grid-cols-(--grid-limit) items-center gap-3 border-t border-line-soft py-2.5 pr-4.5 pl-3.5"
          >
            <div className="min-w-0">
              <div
                className={cx(
                  "truncate font-mono text-body font-medium",
                  incident.status !== INCIDENT_STATUS.open && "text-muted",
                )}
              >
                {incident.account}
              </div>
              <div className="mt-0.75 flex gap-1.5 whitespace-nowrap font-mono text-xs text-dim">
                <span>{incident.ip}</span>
                <span>· {INCIDENTS_TEXT.attempts(incident.attempts)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.25">
              <IncidentStatusTag incident={incident} />
              <span className="font-mono text-xs text-dim">{when(incident)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default IncidentsCard;
