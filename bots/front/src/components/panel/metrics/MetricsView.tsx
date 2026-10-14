"use client";

import ActionMix from "@components/panel/metrics/charts/ActionMix";
import ActivityCard from "@components/panel/metrics/charts/ActivityCard";
import CodesCard from "@components/panel/metrics/charts/CodesCard";
import LatencyCard from "@components/panel/metrics/charts/LatencyCard";
import PopulationCard from "@components/panel/metrics/charts/PopulationCard";
import useSliceSelection from "@components/panel/shared/slice/hooks/useSliceSelection";
import SliceDetailModal from "@components/panel/shared/slice/SliceDetailModal";
import { LOAD_PACE } from "@contracts/panel";
import { SLICE_SECONDS } from "@lib/panel/slices";

import type { MetricsViewProps } from "@components/panel/metrics/interfaces/metricsTypes";

/**
 * Population, latency, response codes, activity per bot, action mix. One column below 1100px,
 * two from 1100, three from 1600 (the mix then spans two). Daily pace: the last 24 h, 1 point every
 * 15 min; burst: the last 80 s (PFA-205). Every chart has its tooltip, and a click on a slice of
 * the first three opens that slice's detail (PFA-229).
 */
const MetricsView = ({ app, view }: MetricsViewProps) => {
  const day = view.loadPace === LOAD_PACE.daily;
  const history = day ? view.dayHistory : view.history;
  const seconds = day ? SLICE_SECONDS.day : SLICE_SECONDS.burst;
  const slices = useSliceSelection(history);
  const chart = { history, seconds, onSelect: slices.select };
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 desktop:grid-cols-2 wide:grid-cols-3">
      <PopulationCard {...chart} />
      <LatencyCard {...chart} />
      <CodesCard {...chart} />
      <ActivityCard
        app={app}
        view={view}
      />
      <ActionMix
        view={view}
        history={history}
        seconds={seconds}
      />
      {/* Always mounted, so closing plays its animation before the content goes. */}
      <SliceDetailModal
        app={app}
        point={slices.point}
        seconds={seconds}
        actionNames={view.mixRuns.map((entry) => entry.name)}
        dailyIds={view.dailyIds}
        open={slices.open}
        onClose={slices.close}
      />
    </div>
  );
};

export default MetricsView;
