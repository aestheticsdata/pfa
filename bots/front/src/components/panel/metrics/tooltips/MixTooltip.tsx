import TooltipBody from "@components/ui/TooltipBody";
import { count } from "@lib/format/format";
import { CHART_TEXT } from "@text/charts";
import { ACTIONS_TEXT } from "@text/metrics";

import type { MixTooltipProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** An action of the mix: its runs and share since the runner started, its current rate and errors. */
const MixTooltip = ({ entry }: MixTooltipProps) => {
  const text = CHART_TEXT.action;
  const { action } = entry;
  return (
    <TooltipBody
      title={entry.name}
      sub={action && !action.enabled ? text.off : undefined}
      rows={[
        { label: text.runs, value: count(entry.count), color: entry.color },
        { label: text.share, value: `${entry.share}%` },
        { label: text.perMin, value: action?.perMin == null ? "—" : ACTIONS_TEXT.perMin(action.perMin) },
        {
          label: text.errorRate,
          value: `${action?.errorRate ?? 0}%`,
          bad: (action?.errorRate ?? 0) > 0,
        },
      ]}
      hint={CHART_TEXT.hint}
    />
  );
};

export default MixTooltip;
