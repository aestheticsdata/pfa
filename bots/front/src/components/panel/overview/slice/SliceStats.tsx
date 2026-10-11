import { cx } from "@lib/classNames/cx";
import { count } from "@lib/format/format";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SlicePartProps } from "@components/panel/overview/interfaces/overviewTypes";

/** The slice in figures: actions, errors and their rate, bots active, requests, latency, population. */
const SliceStats = ({ point }: SlicePartProps) => {
  const text = OVERVIEW_TEXT.slice;
  const attempts = point.actions + point.errors;
  const errorRate = attempts === 0 ? 0 : Math.round((point.errors / attempts) * 1000) / 10;
  const facts = [
    { label: text.actions, value: count(point.actions) },
    { label: text.errors, value: `${count(point.errors)} · ${errorRate}%`, bad: point.errors > 0 },
    { label: text.bots, value: count(Object.keys(point.byBot).length) },
    { label: text.requests, value: count(point.requests) },
    { label: text.latency, value: point.requests > 0 ? `${point.p50} / ${point.p95} ms` : "—" },
    { label: text.population, value: `${point.live} / ${point.target}` },
  ];
  return (
    // 1px gaps over the line colour draw the inner rules, whatever the column count.
    <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-ctl border border-line-soft bg-line-soft tablet:grid-cols-3">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="bg-panel2 px-3 py-2.5"
        >
          <dt className="text-tiny uppercase tracking-th text-dim">{fact.label}</dt>
          <dd className={cx("m-0 mt-1 font-mono text-title font-medium tracking-figure", fact.bad && "text-bad")}>
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default SliceStats;
