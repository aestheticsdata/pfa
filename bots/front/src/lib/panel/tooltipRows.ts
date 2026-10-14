import { count } from "@lib/format/format";
import { actionColor } from "@lib/panel/actionColors";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { SLICE_SECONDS } from "@lib/panel/slices";
import { CHART_TEXT } from "@text/charts";

import type { TooltipRow } from "@components/ui/interfaces/uiTypes";
import type { ActivityPoint } from "@contracts/interfaces/panelTypes";
import type { SliceActionsQuery } from "@lib/panel/interfaces/tooltipRowTypes";

/** A slice's count as its chart reads it: a rate in burst (the API scales it), a count in a 15-min slice. */
export function figure(value: number, seconds: number): string {
  return seconds === SLICE_SECONDS.burst ? CHART_TEXT.perMin(count(value)) : count(value);
}

export function populationRows(point: ActivityPoint): TooltipRow[] {
  return [
    { label: CHART_TEXT.live, value: count(point.live), color: CHART_COLOR.live },
    { label: CHART_TEXT.target, value: count(point.target), color: CHART_COLOR.target },
  ];
}

export function latencyRows(point: ActivityPoint, seconds: number): TooltipRow[] {
  const idle = point.requests === 0;
  return [
    { label: CHART_TEXT.p50, value: idle ? "—" : `${point.p50}ms`, color: CHART_COLOR.p50 },
    { label: CHART_TEXT.p95, value: idle ? "—" : `${point.p95}ms`, color: CHART_COLOR.p95 },
    { label: CHART_TEXT.requests, value: figure(point.requests, seconds) },
  ];
}

export function codesRows(point: ActivityPoint, seconds: number): TooltipRow[] {
  return [
    { label: "2xx", value: figure(point.codes2xx, seconds), color: CHART_COLOR.codes2xx },
    { label: "4xx", value: figure(point.codes4xx, seconds), color: CHART_COLOR.codes4xx },
    { label: "5xx", value: figure(point.codes5xx, seconds), color: CHART_COLOR.codes5xx, bad: point.codes5xx > 0 },
  ];
}

/** The day chart's slice: each action that ran (busiest first), the unattributed rest, the errors. */
export function sliceActionRows({ point, actionNames }: SliceActionsQuery): TooltipRow[] {
  const named = Object.values(point.byAction).reduce((sum, runs) => sum + runs, 0);
  const other = Math.max(0, point.actions - named);
  const rows: TooltipRow[] = actionNames
    .map((name) => ({ name, runs: point.byAction[name] ?? 0 }))
    .filter((entry) => entry.runs > 0)
    .sort((a, b) => b.runs - a.runs)
    .map((entry) => ({ label: entry.name, value: count(entry.runs), color: actionColor(actionNames, entry.name) }));
  if (other > 0) rows.push({ label: CHART_TEXT.other, value: count(other), color: CHART_COLOR.other });
  rows.push({ label: CHART_TEXT.errors, value: count(point.errors), color: CHART_COLOR.errors, bad: point.errors > 0 });
  return rows;
}

/** Actions and errors of a slice, rates in burst. */
export function activityRows(point: ActivityPoint, seconds: number): TooltipRow[] {
  return [
    { label: CHART_TEXT.actions, value: figure(point.actions, seconds), color: CHART_COLOR.actions },
    {
      label: CHART_TEXT.errors,
      value: figure(point.errors, seconds),
      color: CHART_COLOR.errors,
      bad: point.errors > 0,
    },
  ];
}
