import DayChart from "@components/panel/overview/status/DayChart";
import StatTile from "@components/panel/overview/status/StatTile";
import Card from "@components/ui/Card";
import Dot from "@components/ui/Dot";
import { TONE } from "@components/ui/variants";
import GradientColumns from "@lib/dataviz/GradientColumns";
import { count } from "@lib/format/format";
import { OVERVIEW_TEXT } from "@text/overview";

import type { StatusCardProps } from "@components/panel/overview/interfaces/overviewTypes";

const WARN_RATE = 1.5;
const BAD_RATE = 3;

/**
 * Daily bots · Load bots · Actions/min · Error rate, then the actions over the last 80 s (1 bar a
 * second) or, in daily pace, the last 24 h (1 bar every 15 min, by action, clickable — PFA-206).
 */
const StatusCard = ({ app, status, history, day, actionNames, dailyIds }: StatusCardProps) => {
  const text = OVERVIEW_TEXT.status;
  const rateClass = status.errorRate > BAD_RATE ? "text-bad" : status.errorRate > WARN_RATE ? "text-warn" : undefined;
  return (
    <Card testId="status-card">
      <div className="grid grid-cols-2 border-b border-line-soft tablet:grid-cols-4">
        <StatTile
          label={
            <>
              <Dot tone={TONE.info} />
              {text.daily}
            </>
          }
          value={
            <>
              {status.liveDaily}
              <small className="text-title font-medium text-dim"> / {status.totalDaily}</small>
            </>
          }
          sub={text.permanent}
        />
        <StatTile
          label={
            <>
              <Dot tone={status.loadEnabled ? TONE.ok : TONE.neutral} />
              {text.load}
            </>
          }
          value={
            <>
              {status.liveLoad}
              <small className="text-title font-medium text-dim"> / {status.target}</small>
            </>
          }
          sub={
            status.loadEnabled
              ? text.ofTarget(status.target ? Math.round((status.liveLoad / status.target) * 100) : 0)
              : text.loadOff
          }
        />
        <StatTile
          label={text.apm}
          value={count(status.actionsPerMin)}
          sub={
            <>
              <span className={status.throttled ? "text-warn" : undefined}>
                {text.rps(status.rps.toFixed(1))}
                {status.throttled && text.throttled}
              </span>
              {status.quietHours.active && <span className="text-dim">{text.quiet}</span>}
            </>
          }
        />
        <StatTile
          label={text.errors}
          valueClass={rateClass}
          value={
            <>
              {status.errorRate.toFixed(1)}
              <small className="text-title font-medium text-dim">%</small>
            </>
          }
          sub={text.errorsSub(status.errorsPerMin)}
        />
      </div>
      <div className="px-3.5 py-3">
        {day ? (
          <DayChart
            app={app}
            history={history}
            actionNames={actionNames}
            dailyIds={dailyIds}
          />
        ) : (
          <>
            <div className="mb-2.5 flex flex-wrap justify-between gap-2 text-xs text-dim">
              <span>{text.chart}</span>
            </div>
            <GradientColumns
              values={history.map((point) => point.actions)}
              className="gap-px tablet:gap-0.5"
              ariaLabel={text.chart}
            />
            <div className="mt-1.5 flex justify-between font-mono text-tiny text-dim">
              {text.axis.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default StatusCard;
