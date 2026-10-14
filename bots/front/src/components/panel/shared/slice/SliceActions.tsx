import SliceSection from "@components/panel/shared/slice/SliceSection";
import { count } from "@lib/format/format";
import { actionColor } from "@lib/panel/actionColors";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SliceActionsProps } from "@components/panel/shared/slice/interfaces/sliceTypes";

/** What the bots did, by action: a bar each (their share of the busiest), successes and failures. */
const SliceActions = ({ point, actionNames }: SliceActionsProps) => {
  const text = OVERVIEW_TEXT.slice;
  const names = [...new Set([...Object.keys(point.byAction), ...Object.keys(point.errorsByAction)])];
  const rows = names
    .map((name) => ({ name, ok: point.byAction[name] ?? 0, failed: point.errorsByAction[name] ?? 0 }))
    .sort((a, b) => b.ok + b.failed - (a.ok + a.failed));
  const busiest = Math.max(1, ...rows.map((row) => row.ok + row.failed));
  return (
    <SliceSection
      title={text.byAction}
      aside={text.kinds(rows.length)}
    >
      {rows.length === 0 ? (
        <p className="m-0 text-xs text-dim">{text.none}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <li
              key={row.name}
              className="grid grid-cols-(--grid-by-action-narrow) items-center gap-2.5 font-mono text-note tablet:grid-cols-(--grid-by-action)"
            >
              <span className="flex min-w-0 items-center gap-2">
                <i
                  className="block size-2.5 shrink-0 rounded-xs"
                  style={{ background: actionColor(actionNames, row.name) }}
                />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="flex h-1.5 overflow-hidden rounded-xs bg-bg">
                <span
                  className="block h-full"
                  style={{ width: `${(row.ok / busiest) * 100}%`, background: actionColor(actionNames, row.name) }}
                />
                <span
                  className="block h-full bg-bad"
                  style={{ width: `${(row.failed / busiest) * 100}%` }}
                />
              </span>
              <span className="text-right">
                {count(row.ok)}
                {row.failed > 0 && <span className="text-bad"> +{row.failed}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SliceSection>
  );
};

export default SliceActions;
