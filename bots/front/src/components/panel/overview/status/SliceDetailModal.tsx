"use client";

import { SLICE_MINUTES } from "@components/panel/overview/status/DayChart";
import Modal from "@components/ui/Modal";
import { count, slotRange } from "@lib/format/format";
import { actionColor } from "@lib/panel/actionColors";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SliceDetailModalProps } from "@components/panel/overview/interfaces/overviewTypes";

/** What the bots did in one 15-minute slice of the day chart: totals, by action, latency, codes. */
const SliceDetailModal = ({ point, actionNames, onClose }: SliceDetailModalProps) => {
  const text = OVERVIEW_TEXT.slice;
  const rows = Object.entries(point.byAction)
    .filter(([, runs]) => runs > 0)
    .sort(([, a], [, b]) => b - a);
  const total = point.actions || 1;
  const facts = [
    { label: text.actions, value: count(point.actions) },
    { label: text.errors, value: count(point.errors) },
    { label: text.requests, value: count(point.requests) },
    { label: text.latency, value: `${point.p50} / ${point.p95} ms` },
    { label: text.codes, value: `${point.codes2xx} · ${point.codes4xx} · ${point.codes5xx}` },
  ];
  return (
    <Modal
      open
      onClose={onClose}
      title={text.title}
      sub={slotRange(point.at, SLICE_MINUTES)}
      testId="slice-modal"
    >
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 tablet:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-tiny uppercase tracking-th text-dim">{fact.label}</dt>
            <dd className="m-0 mt-0.5 font-mono text-body">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <h4 className="m-0 mt-5 mb-2 text-tiny font-medium uppercase tracking-th text-dim">{text.byAction}</h4>
      {rows.length === 0 ? (
        <p className="m-0 text-xs text-dim">{text.none}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 font-mono text-note">
          {rows.map(([name, runs]) => (
            <li
              key={name}
              className="flex items-center gap-2.5"
            >
              <i
                className="block size-2.5 shrink-0 rounded-xs"
                style={{ background: actionColor(actionNames, name) }}
              />
              <span className="min-w-0 flex-1 truncate">{name}</span>
              <span className="text-muted">{count(runs)}</span>
              <span className="w-10 text-right">{Math.round((runs / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default SliceDetailModal;
