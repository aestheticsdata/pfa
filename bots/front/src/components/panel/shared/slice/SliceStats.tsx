import FactGrid from "@components/panel/shared/FactGrid";
import { count } from "@lib/format/format";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SlicePartProps } from "@components/panel/shared/slice/interfaces/sliceTypes";

/** The slice in figures: actions, errors and their rate, bots active, requests, latency, population. */
const SliceStats = ({ point }: SlicePartProps) => {
  const text = OVERVIEW_TEXT.slice;
  const attempts = point.actions + point.errors;
  const errorRate = attempts === 0 ? 0 : Math.round((point.errors / attempts) * 1000) / 10;
  return (
    <FactGrid
      facts={[
        { label: text.actions, value: count(point.actions) },
        { label: text.errors, value: `${count(point.errors)} · ${errorRate}%`, bad: point.errors > 0 },
        { label: text.bots, value: count(Object.keys(point.byBot).length) },
        { label: text.requests, value: count(point.requests) },
        { label: text.latency, value: point.requests > 0 ? `${point.p50} / ${point.p95} ms` : "—" },
        { label: text.population, value: `${point.live} / ${point.target}` },
      ]}
    />
  );
};

export default SliceStats;
