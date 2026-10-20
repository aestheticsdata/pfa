import BandSpacer from "@components/statistics/dayOfWeek/BandSpacer";
import { BAND_COLS } from "@components/statistics/dayOfWeek/constants";
import Guides from "@components/statistics/dayOfWeek/Guides";

import type { GuidesProps } from "@components/statistics/interfaces/dayOfWeekTypes";

/**
 * The references as one unbroken line down the whole plot, from `md` up: a band
 * mirroring the row grid puts its middle cell exactly over the bar column, so a
 * single full-height element spans every row — no dash ever restarts mid-plot.
 */
const PlotGuides = (props: GuidesProps) => (
  <div
    className={`${BAND_COLS} pointer-events-none absolute inset-0 hidden md:grid`}
    aria-hidden
  >
    <BandSpacer />
    <div className="relative">
      <Guides {...props} />
    </div>
    <BandSpacer />
  </div>
);

export default PlotGuides;
