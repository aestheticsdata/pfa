import KillSwitch from "@components/panel/overview/controls/KillSwitch";
import LoadPace from "@components/panel/overview/controls/LoadPace";
import LoadSwitch from "@components/panel/overview/controls/LoadSwitch";
import LoadTarget from "@components/panel/overview/controls/LoadTarget";
import QuietHours from "@components/panel/overview/controls/QuietHours";
import RampUp from "@components/panel/overview/controls/RampUp";
import Card from "@components/ui/Card";

import type { ControlProps } from "@components/panel/overview/interfaces/overviewTypes";

/**
 * Kill switch, load switch, load target, ramp-up, load pace, quiet hours. One column on a phone and
 * on desktop; on a tablet the card goes full width in two columns (switches + target | ramp, pace +
 * quiet hours).
 */
const ControlsCard = ({ app, status }: ControlProps) => (
  <Card
    className="tablet:grid tablet:grid-cols-2 desktop:block"
    testId="controls-card"
  >
    <div className="contents tablet:block tablet:min-w-0 desktop:contents">
      <KillSwitch
        app={app}
        status={status}
      />
      <LoadSwitch
        app={app}
        status={status}
      />
      <LoadTarget
        app={app}
        status={status}
      />
    </div>
    <div className="contents tablet:block tablet:min-w-0 tablet:border-l tablet:border-line-soft tablet:[&>*:first-child]:border-t-0 desktop:contents desktop:[&>*:first-child]:border-t">
      <RampUp
        app={app}
        status={status}
      />
      <LoadPace
        app={app}
        status={status}
      />
      <QuietHours
        app={app}
        quiet={status.quietHours}
      />
    </div>
  </Card>
);

export default ControlsCard;
