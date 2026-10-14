"use client";

import ChartCard from "@components/panel/metrics/ChartCard";
import Histogram from "@components/panel/metrics/charts/Histogram";
import BucketBotsModal from "@components/panel/metrics/dialogs/BucketBotsModal";
import { LOAD_PACE } from "@contracts/panel";
import { METRICS_TEXT } from "@text/metrics";
import { useState } from "react";

import type { ActivityCardProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** Live bots by activity (actions/min, or actions over 24 h in daily pace); a bar opens its bots. */
const ActivityCard = ({ app, view }: ActivityCardProps) => {
  const day = view.loadPace === LOAD_PACE.daily;
  const buckets = day ? view.dayActivity : view.activity;
  // The bucket by its label: its bots are re-read at every refresh while the modal is open.
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const bucket = buckets.find((entry) => entry.label === selected);
  return (
    <ChartCard
      title={METRICS_TEXT.activity}
      sub={(day ? METRICS_TEXT.activitySubDay : METRICS_TEXT.activitySub)(view.liveBots)}
      axis={[]}
    >
      <Histogram
        buckets={buckets}
        day={day}
        liveBots={view.liveBots}
        onSelect={(label) => {
          setSelected(label);
          setOpen(true);
        }}
      />
      <BucketBotsModal
        app={app}
        bucket={bucket}
        day={day}
        dailyIds={view.dailyIds}
        open={open && bucket !== undefined}
        onClose={() => setOpen(false)}
      />
    </ChartCard>
  );
};

export default ActivityCard;
