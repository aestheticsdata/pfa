import Guides from "@components/statistics/dayOfWeek/Guides";

import type { GuidesProps } from "@components/statistics/interfaces/dayOfWeekTypes";

/** The same references over a single row's bar, below `md` only: the stacked row
 *  puts a day name and an amount beside each bar, which a plot-height line would
 *  strike through. */
const RowGuides = (props: GuidesProps) => (
  <div
    className="pointer-events-none absolute inset-0 md:hidden"
    aria-hidden
  >
    <Guides {...props} />
  </div>
);

export default RowGuides;
