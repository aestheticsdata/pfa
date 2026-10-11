"use client";

import LegendItem from "@components/panel/metrics/LegendItem";
import SliceDetailModal from "@components/panel/overview/slice/SliceDetailModal";
import StackedColumns from "@lib/dataviz/StackedColumns";
import { slotRange } from "@lib/format/format";
import { actionColor } from "@lib/panel/actionColors";
import { OVERVIEW_TEXT } from "@text/overview";
import { useState } from "react";

import type { DayChartProps } from "@components/panel/overview/interfaces/overviewTypes";
import type { ActivityPoint } from "@contracts/interfaces/panelTypes";

/** The day chart's slices: 15 minutes each (the runner's `GET /history/day`). */
export const SLICE_MINUTES = 15;

/** Actions of the slice that no action name accounts for. */
const unattributed = (slice: ActivityPoint) =>
  Math.max(0, slice.actions - Object.values(slice.byAction).reduce((sum, runs) => sum + runs, 0));

/**
 * The last 24 h in daily pace (PFA-206): one bar every 15 min, stacked by action in the Metrics
 * mix's colours, errors on top in red. A bar with activity opens its detail; an empty one doesn't.
 */
const DayChart = ({ app, history, actionNames, dailyIds }: DayChartProps) => {
  const text = OVERVIEW_TEXT.status;
  // The slice by its start, not its index: the window slides every 15 min while the modal is open.
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const seen = actionNames.filter((name) => history.some((point) => (point.byAction[name] ?? 0) > 0));
  const point = history.find((slice) => slice.at === selected);
  const select = (index: number) => {
    setSelected(history[index]?.at ?? null);
    setOpen(true);
  };
  return (
    <>
      <div className="mb-2.5 flex flex-wrap justify-between gap-2 text-xs text-dim">
        <span>{text.chartDay}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono">
          {seen.map((name) => (
            <LegendItem
              key={name}
              color={actionColor(actionNames, name)}
              label={name}
            />
          ))}
          {history.some((slice) => slice.errors > 0) && (
            <LegendItem
              color="var(--bad)"
              label={text.errorsLegend}
            />
          )}
        </div>
      </div>
      <StackedColumns
        className="chart-plot gap-px"
        ariaLabel={text.chartDay}
        onSelect={select}
        columns={history.map((slice) => ({
          key: slice.at,
          label: text.sliceLabel(slotRange(slice.at, SLICE_MINUTES), slice.actions),
          parts: [
            ...actionNames.map((name) => ({
              label: name,
              value: slice.byAction[name] ?? 0,
              color: actionColor(actionNames, name),
            })),
            // Slices saved before PFA-206 have no breakdown: their actions show as one grey block.
            { label: "other", value: unattributed(slice), color: "var(--faint)" },
            { label: "errors", value: slice.errors, color: "var(--bad)" },
          ],
        }))}
      />
      <div className="mt-1.5 flex justify-between font-mono text-tiny text-dim">
        {text.axisDay.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      {/* Always mounted, so closing plays its animation before the content goes. */}
      <SliceDetailModal
        app={app}
        point={point}
        actionNames={actionNames}
        dailyIds={dailyIds}
        open={open && point !== undefined}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default DayChart;
