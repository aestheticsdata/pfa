import ChartCard from "@components/panel/metrics/ChartCard";
import StackedBar from "@lib/dataviz/StackedBar";
import { count } from "@lib/format/format";
import { METRICS_TEXT } from "@text/metrics";

import type { ActionMixProps } from "@components/panel/metrics/interfaces/metricsTypes";

const SERIES = ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5", "--series-6"];

/** What the bots did, by action, since the runner started: one stacked bar and its legend. */
const ActionMix = ({ view }: ActionMixProps) => {
  const enabled = new Map(view.actionMix.map((action) => [action.name, action.enabled]));
  const mix = view.mixRuns
    .map((entry, index) => ({ ...entry, color: `var(${SERIES[index % SERIES.length]})` }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
  const total = mix.reduce((sum, entry) => sum + entry.count, 0) || 1;
  const off = mix.filter((entry) => enabled.get(entry.name) === false).map((entry) => entry.name);
  return (
    <ChartCard
      title={METRICS_TEXT.mix}
      sub={METRICS_TEXT.mixSub(count(total))}
      axis={[]}
      className="col-span-full wide:col-span-2"
    >
      <StackedBar
        className="mt-1 mb-3.5 h-3.5"
        segments={mix.map((entry) => ({ label: entry.name, value: entry.count, color: entry.color }))}
        faded={off}
        ariaLabel={METRICS_TEXT.mix}
      />
      <div className="grid grid-cols-(--grid-mix-narrow) items-center gap-x-2.5 gap-y-1.5 font-mono text-note tablet:grid-cols-(--grid-mix)">
        {mix.map((entry) => (
          <div
            key={entry.name}
            className={off.includes(entry.name) ? "contents text-dim" : "contents"}
          >
            <i
              className="block size-2.5 rounded-xs"
              style={{ background: entry.color, opacity: off.includes(entry.name) ? 0.35 : 1 }}
            />
            <span className="truncate">{entry.name}</span>
            <span className="text-right text-muted">{count(entry.count)}</span>
            <span className="text-right">{Math.round((entry.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
};

export default ActionMix;
