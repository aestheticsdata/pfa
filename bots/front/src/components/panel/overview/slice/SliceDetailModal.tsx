"use client";

import SliceActions from "@components/panel/overview/slice/SliceActions";
import SliceBots from "@components/panel/overview/slice/SliceBots";
import SliceResponses from "@components/panel/overview/slice/SliceResponses";
import SliceStats from "@components/panel/overview/slice/SliceStats";
import { SLICE_MINUTES } from "@components/panel/overview/status/DayChart";
import Modal from "@components/ui/Modal";
import { slotRange, weekDay } from "@lib/format/format";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SliceDetailModalProps } from "@components/panel/overview/interfaces/overviewTypes";

/**
 * One 15-minute slice of the day chart (PFA-206/209): the figures, what the bots did by action, how
 * the app answered, and who was active — each bot opens its drawer.
 */
const SliceDetailModal = ({ app, point, actionNames, dailyIds, open, onClose }: SliceDetailModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    title={OVERVIEW_TEXT.slice.title}
    sub={point ? `${weekDay(point.at)} · ${slotRange(point.at, SLICE_MINUTES)}` : undefined}
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

export default SliceDetailModal;
