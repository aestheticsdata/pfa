import Dot from "@components/ui/Dot";
import { TONE } from "@components/ui/variants";
import { PANEL_TEXT } from "@text/panel";

import type { StatusPillProps } from "@components/panel/topBar/interfaces/topBarTypes";

/** `● runner live` / `● runner stopped`; on a phone, the dot alone. */
const StatusPill = ({ running }: StatusPillProps) => {
  const label = running ? PANEL_TEXT.runnerLive : PANEL_TEXT.runnerStopped;
  return (
    <span
      title={label}
      data-testid="runner-status"
      className="inline-flex h-10 w-7 shrink-0 items-center justify-center whitespace-nowrap text-xs text-muted tablet:h-auto tablet:w-auto tablet:gap-1.5 tablet:rounded-full tablet:border tablet:border-line tablet:bg-panel2 tablet:px-2.5 tablet:py-1"
    >
      <Dot tone={running ? TONE.ok : TONE.neutral} />
      <span className="hidden tablet:inline">{label}</span>
    </span>
  );
};

export default StatusPill;
