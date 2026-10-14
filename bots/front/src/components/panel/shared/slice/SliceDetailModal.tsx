"use client";

import SliceActions from "@components/panel/shared/slice/SliceActions";
import SliceBots from "@components/panel/shared/slice/SliceBots";
import SliceResponses from "@components/panel/shared/slice/SliceResponses";
import SliceStats from "@components/panel/shared/slice/SliceStats";
import Modal from "@components/ui/Modal";
import { sliceCounts, sliceWhen } from "@lib/panel/slices";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SliceDetailModalProps } from "@components/panel/shared/slice/interfaces/sliceTypes";

/**
 * One slice of a chart (PFA-206/209), 15 min in daily pace or 1 s in burst — the Overview's chart
 * and the Metrics ones (PFA-229): the figures, what the bots did by action, how the app answered,
 * and who was active — each bot opens its drawer. A burst slice shows its counts, not its rates.
 */
const SliceDetailModal = ({
  app,
  point: shown,
  seconds,
  actionNames,
  dailyIds,
  open,
  onClose,
}: SliceDetailModalProps) => {
  const point = shown && sliceCounts(shown, seconds);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={OVERVIEW_TEXT.slice.title}
      sub={point ? sliceWhen(point.at, seconds) : undefined}
      testId="slice-modal"
      className="tablet:max-w-modal-wide"
    >
      {point && (
        <div className="flex flex-col gap-4.5">
          <SliceStats point={point} />
          <SliceActions
            point={point}
            actionNames={actionNames}
          />
          <SliceResponses point={point} />
          <SliceBots
            app={app}
            point={point}
            dailyIds={dailyIds}
            onLeave={onClose}
          />
        </div>
      )}
    </Modal>
  );
};

export default SliceDetailModal;
