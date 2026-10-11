import DailyBotsCard from "@components/panel/overview/cards/DailyBotsCard";
import HardLimitsCard from "@components/panel/overview/cards/HardLimitsCard";
import UploadBudgetCard from "@components/panel/overview/cards/UploadBudgetCard";
import ControlsCard from "@components/panel/overview/controls/ControlsCard";
import StatusCard from "@components/panel/overview/status/StatusCard";
import EmptyNotice from "@components/panel/shared/EmptyNotice";
import { LOAD_PACE } from "@contracts/panel";
import { OVERVIEW_TEXT } from "@text/overview";

import type { OverviewProps } from "@components/panel/overview/interfaces/overviewTypes";

/**
 * Desktop: Controls on the left (330–360px), and on the right Status with the three cards under it
 * (3 across from 1360px, 2 + 1 below). Tablet: Controls full width, then Status, then 2 + 1.
 * Phone: everything stacked. Nothing stretches to its neighbour's height.
 */
const OverviewView = ({ app, appName, configured, view }: OverviewProps) => {
  // Daily pace: a visit or two a day, so the chart is the last 24 h; burst: the last 80 s (PFA-204).
  const daily = view.status.loadPace === LOAD_PACE.daily;
  return (
    <>
      {!configured && <EmptyNotice>{OVERVIEW_TEXT.empty(appName)}</EmptyNotice>}
      <div className="mt-4 grid grid-cols-1 items-start gap-3.5 desktop:grid-cols-(--grid-overview)">
        <ControlsCard
          app={app}
          status={view.status}
        />
        <div className="flex min-w-0 flex-col gap-3.5">
          <StatusCard
            status={view.status}
            history={daily ? view.dayHistory : view.history}
            day={daily}
            actionNames={view.actionNames}
          />
          <div className="grid grid-cols-1 items-start gap-3.5 tablet:grid-cols-2 roomy:grid-cols-3">
            <DailyBotsCard
              app={app}
              bots={view.dailyBots}
            />
            <UploadBudgetCard status={view.status} />
            <HardLimitsCard status={view.status} />
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewView;
