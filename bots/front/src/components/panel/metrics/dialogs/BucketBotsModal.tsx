"use client";

import BotBars from "@components/panel/shared/BotBars";
import Modal from "@components/ui/Modal";
import { CHART_TEXT } from "@text/charts";

import type { BucketBotsModalProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** A histogram bar's bots, busiest first (PFA-229): each opens its drawer. */
const BucketBotsModal = ({ app, bucket, day, dailyIds, open, onClose }: BucketBotsModalProps) => {
  const text = CHART_TEXT.bucketModal;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={text.title}
      sub={bucket ? text.sub(bucket.label, day, bucket.count) : undefined}
      testId="bucket-modal"
      className="tablet:max-w-modal-wide"
    >
      {bucket &&
        (bucket.bots.length === 0 ? (
          <p className="m-0 text-xs text-dim">{text.none}</p>
        ) : (
          <BotBars
            app={app}
            bots={bucket.bots.map((bot) => ({ id: bot.id, value: bot.value, label: text.value(bot.value, day) }))}
            dailyIds={dailyIds}
            onLeave={onClose}
          />
        ))}
    </Modal>
  );
};

export default BucketBotsModal;
