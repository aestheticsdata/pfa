/** The chart series, in order: an action's colour is its place in the registry (Metrics' action mix, overview's day chart). */
const SERIES = ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5", "--series-6"];

/** `var(--series-N)` for the action, by its index among the registry's names; the first series when unknown. */
export function actionColor(names: string[], name: string): string {
  const index = Math.max(0, names.indexOf(name));
  return `var(${SERIES[index % SERIES.length]})`;
}
