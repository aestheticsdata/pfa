import { cx } from "@lib/classNames/cx";

import type { FactGridProps } from "@components/panel/shared/interfaces/sharedTypes";

/** A detail's figures in ruled cells: two across on a phone, three from 700px (slice, action). */
const FactGrid = ({ facts }: FactGridProps) => (
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

export default FactGrid;
