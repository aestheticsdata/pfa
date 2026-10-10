import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { INCIDENT_STATUS } from "@contracts/panel";

import type { IncidentStatusTagProps } from "@components/panel/incidents/interfaces/incidentsTypes";

const TONES = {
  [INCIDENT_STATUS.open]: TONE.bad,
  [INCIDENT_STATUS.acknowledged]: TONE.neutral,
  [INCIDENT_STATUS.disabled]: TONE.ok,
  [INCIDENT_STATUS.purged]: TONE.ok,
};

/** `open` red, `acknowledged` neutral, `disabled` / `purged` green (dealt with). */
const IncidentStatusTag = ({ incident }: IncidentStatusTagProps) => (
  <Tag tone={TONES[incident.status as keyof typeof TONES] ?? TONE.neutral}>{incident.status}</Tag>
);

export default IncidentStatusTag;
