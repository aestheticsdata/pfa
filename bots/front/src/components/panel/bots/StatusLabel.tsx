import { stateTone } from "@components/panel/bots/botState";
import Dot from "@components/ui/Dot";
import { BOTS_TEXT } from "@text/bots";

import type { StatusLabelProps } from "@components/panel/bots/interfaces/botsTypes";

/** `● Running`, `● Degraded`… */
const StatusLabel = ({ state }: StatusLabelProps) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    <Dot tone={stateTone(state)} />
    {BOTS_TEXT.states[state as keyof typeof BOTS_TEXT.states] ?? state}
  </span>
);

export default StatusLabel;
