"use client";

import ActionRunsChart from "@components/panel/metrics/charts/ActionRunsChart";
import FactGrid from "@components/panel/shared/FactGrid";
import SliceSection from "@components/panel/shared/slice/SliceSection";
import Modal from "@components/ui/Modal";
import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { count } from "@lib/format/format";
import { SLICE_SECONDS } from "@lib/panel/slices";
import { CHART_TEXT } from "@text/charts";
import { ACTIONS_TEXT } from "@text/metrics";

import type { ActionDetailModalProps } from "@components/panel/metrics/interfaces/metricsTypes";

/**
 * An action of the mix (PFA-229): what it does, its figures since the runner started, and its runs
 * over the chart's window, slice by slice.
 */
const ActionDetailModal = ({ entry, history, seconds, open, onClose }: ActionDetailModalProps) => {
  const text = CHART_TEXT.actionModal;
  const action = entry?.action;
  const inWindow = entry ? history.reduce((sum, point) => sum + (point.byAction[entry.name] ?? 0), 0) : 0;
  const flags = [
    action?.enabled === false && { tone: TONE.neutral, label: text.flags.off },
    action?.quiet && { tone: TONE.info, label: text.flags.quiet },
    action?.budget && { tone: TONE.warn, label: text.flags.budget },
  ].filter((flag) => flag !== false && flag !== undefined);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry?.name ?? ""}
      sub={entry ? text.sub(count(entry.count)) : undefined}
      testId="action-modal"
      className="tablet:max-w-modal-wide"
    >
      {entry && (
        <div className="flex flex-col gap-4.5">
          {(action?.description || flags.length > 0) && (
            <div className="flex flex-col gap-2">
              {action?.description && <p className="m-0 text-sm text-muted">{action.description}</p>}
              {flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {flags.map((flag) => (
                    <Tag
                      key={flag.label}
                      tone={flag.tone}
                    >
                      {flag.label}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}
          <FactGrid
            facts={[
              { label: CHART_TEXT.action.runs, value: count(entry.count) },
              { label: CHART_TEXT.action.share, value: `${entry.share}%` },
              {
                label: CHART_TEXT.action.perMin,
                value: action?.perMin == null ? "—" : ACTIONS_TEXT.perMin(action.perMin),
              },
              {
                label: CHART_TEXT.action.errorRate,
                value: `${action?.errorRate ?? 0}%`,
                bad: (action?.errorRate ?? 0) > 0,
              },
              { label: CHART_TEXT.action.weight, value: String(action?.weight ?? "—") },
              { label: CHART_TEXT.action.window, value: count(inWindow) },
            ]}
          />
          <SliceSection title={text.over(seconds === SLICE_SECONDS.day)}>
            {inWindow === 0 ? (
              <p className="m-0 text-xs text-dim">{text.none}</p>
            ) : (
              <ActionRunsChart
                name={entry.name}
                color={entry.color}
                history={history}
                seconds={seconds}
              />
            )}
          </SliceSection>
        </div>
      )}
    </Modal>
  );
};

export default ActionDetailModal;
