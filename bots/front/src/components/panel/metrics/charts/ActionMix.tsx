"use client";

import usePlotHover from "@components/hooks/usePlotHover";
import ChartCard from "@components/panel/metrics/ChartCard";
import MixLegend from "@components/panel/metrics/charts/MixLegend";
import ActionDetailModal from "@components/panel/metrics/dialogs/ActionDetailModal";
import MixTooltip from "@components/panel/metrics/tooltips/MixTooltip";
import CursorTooltip from "@components/ui/CursorTooltip";
import StackedBar from "@lib/dataviz/StackedBar";
import { count } from "@lib/format/format";
import { mixEntries } from "@lib/panel/actionMix";
import { METRICS_TEXT } from "@text/metrics";
import { useState } from "react";

import type { ActionMixProps } from "@components/panel/metrics/interfaces/metricsTypes";

/**
 * What the bots did, by action, since the runner started: one stacked bar and its legend. A segment
 * or a legend row has its tooltip and opens the action's detail (PFA-229).
 */
const ActionMix = ({ view, history, seconds }: ActionMixProps) => {
  const { hover, index, onHover } = usePlotHover();
  // The action by its name: its figures are re-read at every refresh while the modal is open.
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const mix = mixEntries(view.mixRuns, view.actionMix);
  const total = mix.reduce((sum, entry) => sum + entry.count, 0);
  const off = mix.filter((entry) => entry.action?.enabled === false).map((entry) => entry.name);
  const hovered = index === null ? undefined : mix[index];
  const select = (name: string) => {
    setSelected(name);
    setOpen(true);
  };
  const entry = mix.find((candidate) => candidate.name === selected);
  return (
    <ChartCard
      title={METRICS_TEXT.mix}
      sub={METRICS_TEXT.mixSub(count(total || 1))}
      axis={[]}
      className="col-span-full wide:col-span-2"
    >
      <StackedBar
        className="mt-1 mb-3.5 h-3.5"
        segments={mix.map((item) => ({ label: item.name, value: item.count, color: item.color }))}
        faded={off}
        ariaLabel={METRICS_TEXT.mix}
        onHover={onHover}
        onSelect={(at) => mix[at] && select(mix[at].name)}
        active={index}
      />
      <CursorTooltip point={hover}>{hovered && <MixTooltip entry={hovered} />}</CursorTooltip>
      <MixLegend
        mix={mix}
        onSelect={select}
      />
      <ActionDetailModal
        entry={entry}
        history={history}
        seconds={seconds}
        open={open && entry !== undefined}
        onClose={() => setOpen(false)}
      />
    </ChartCard>
  );
};

export default ActionMix;
