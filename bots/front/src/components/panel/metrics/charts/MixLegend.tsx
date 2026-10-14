import MixTooltip from "@components/panel/metrics/tooltips/MixTooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/Tooltip";
import { cx } from "@lib/classNames/cx";
import { count } from "@lib/format/format";

import type { MixLegendProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** The mix's legend: a row per action (swatch, name, runs, share), each with its tooltip, each opening its detail. */
const MixLegend = ({ mix, onSelect }: MixLegendProps) => (
  <div className="grid grid-cols-(--grid-mix-narrow) items-center gap-x-2.5 gap-y-1.5 font-mono text-note tablet:grid-cols-(--grid-mix)">
    {mix.map((entry) => {
      const off = entry.action?.enabled === false;
      return (
        <Tooltip key={entry.name}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onSelect(entry.name)}
              className={cx(
                "col-span-4 grid cursor-pointer grid-cols-subgrid items-center rounded-ctl text-left hover:bg-hover focus-visible:bg-hover focus-visible:outline-none",
                off && "text-dim",
              )}
            >
              <i
                className="block size-2.5 rounded-xs"
                style={{ background: entry.color, opacity: off ? 0.35 : 1 }}
              />
              <span className="truncate">{entry.name}</span>
              <span className="text-right text-muted">{count(entry.count)}</span>
              <span className="text-right">{entry.share}%</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <MixTooltip entry={entry} />
          </TooltipContent>
        </Tooltip>
      );
    })}
  </div>
);

export default MixLegend;
