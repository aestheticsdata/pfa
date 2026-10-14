import BotBars from "@components/panel/shared/BotBars";
import SliceSection from "@components/panel/shared/slice/SliceSection";
import { count } from "@lib/format/format";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SliceBotsProps } from "@components/panel/shared/slice/interfaces/sliceTypes";

/** The busiest bots shown; the rest are counted. */
const MAX_BOTS = 12;

/** Who was active in the slice, busiest first: each opens its bot's drawer. */
const SliceBots = ({ app, point, dailyIds, onLeave }: SliceBotsProps) => {
  const text = OVERVIEW_TEXT.slice;
  const bots = Object.entries(point.byBot)
    .sort(([, a], [, b]) => b - a)
    .map(([id, runs]) => ({ id, value: runs, label: count(runs) }));
  return (
    <SliceSection
      title={text.activeBots}
      aside={text.botsCount(bots.length)}
    >
      {bots.length === 0 ? (
        <p className="m-0 text-xs text-dim">{text.noBots}</p>
      ) : (
        <BotBars
          app={app}
          bots={bots.slice(0, MAX_BOTS)}
          dailyIds={dailyIds}
          onLeave={onLeave}
        />
      )}
      {bots.length > MAX_BOTS && <p className="m-0 mt-2 text-xs text-dim">{text.moreBots(bots.length - MAX_BOTS)}</p>}
    </SliceSection>
  );
};

export default SliceBots;
