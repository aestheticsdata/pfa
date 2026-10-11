"use client";

import useNow from "@components/hooks/useNow";
import { isLive } from "@components/panel/bots/botState";
import { errorClass } from "@components/panel/bots/errorTone";
import KvCell from "@components/panel/drawer/KvCell";
import Label from "@components/ui/Label";
import LocalTime from "@components/ui/LocalTime";
import { BOT_KIND } from "@contracts/panel";
import { cx } from "@lib/classNames/cx";
import StackedColumns from "@lib/dataviz/StackedColumns";
import { ago, count, duration } from "@lib/format/format";
import { DRAWER_TEXT } from "@text/bots";

import type { DrawerPartProps } from "@components/panel/drawer/interfaces/drawerTypes";

/** The drawer's scrolling part: figures, last 30 s, by action, recent requests. */
const DrawerBody = ({ bot }: DrawerPartProps) => {
  const now = useNow(2000);
  const live = isLive(bot.state);
  const byActionTotal = bot.byAction.reduce((sum, entry) => sum + entry.count, 0) || 1;
  const section = "border-b border-line-soft px-3.5 py-2.5";
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      {bot.kind === BOT_KIND.daily && (
        <p className="m-0 border-b border-line-soft bg-infobg px-3.5 py-2.5 text-note text-text">
          {DRAWER_TEXT.permanent}
        </p>
      )}
      <div className="grid grid-cols-2 border-b border-line-soft tablet:grid-cols-3">
        <KvCell
          label={DRAWER_TEXT.apm}
          value={live ? bot.actionsPerMin.toFixed(1) : "—"}
        />
        <KvCell
          label={DRAWER_TEXT.errorRate}
          value={`${bot.errorRate.toFixed(1)}%`}
          valueClass={errorClass(bot.errorRate)}
        />
        <KvCell
          label={DRAWER_TEXT.total}
          value={count(bot.total)}
        />
        <KvCell
          label={DRAWER_TEXT.uploads}
          value={String(bot.uploads)}
        />
        <KvCell
          label={DRAWER_TEXT.session}
          value={bot.sessionStartedAt ? duration(now - new Date(bot.sessionStartedAt).getTime()) : "—"}
        />
        <KvCell
          label={DRAWER_TEXT.lastSeen}
          value={ago(bot.lastSeenAt, now)}
        />
      </div>
      <div className={section}>
        <Label className="mb-2.5 block">{DRAWER_TEXT.activity}</Label>
        <StackedColumns
          className="h-17.5 gap-0.75"
          ariaLabel={DRAWER_TEXT.activity}
          columns={bot.spark.map((slice, index) => ({
            key: String(index),
            parts: [
              { label: "errors", value: slice.errors, color: "var(--bad)" },
              { label: "actions", value: slice.actions, color: "color-mix(in oklch, var(--ok) 50%, transparent)" },
            ],
          }))}
          max={Math.max(0.1, ...bot.spark.map((slice) => slice.actions + slice.errors))}
        />
      </div>
      <div className={section}>
        <Label className="mb-2.5 block">{DRAWER_TEXT.activityDay}</Label>
        <StackedColumns
          className="h-17.5 gap-0.75"
          ariaLabel={DRAWER_TEXT.activityDay}
          columns={bot.daySpark.map((slice, index) => ({
            key: String(index),
            parts: [
              { label: "errors", value: slice.errors, color: "var(--bad)" },
              { label: "actions", value: slice.actions, color: "color-mix(in oklch, var(--ok) 50%, transparent)" },
            ],
          }))}
          max={Math.max(0.1, ...bot.daySpark.map((slice) => slice.actions + slice.errors))}
        />
      </div>
      <div className={section}>
        <Label className="mb-2.5 block">{DRAWER_TEXT.byAction}</Label>
        {bot.byAction.length === 0 ? (
          <p className="m-0 text-xs text-dim">{DRAWER_TEXT.noActions}</p>
        ) : (
          <div className="grid grid-cols-(--grid-by-action-narrow) items-center gap-x-2.5 gap-y-1.5 font-mono text-note tablet:grid-cols-(--grid-by-action)">
            {bot.byAction.map((entry) => (
              <div
                key={entry.name}
                className="contents"
              >
                <span className="truncate">{entry.name}</span>
                <span className="h-1 overflow-hidden rounded-xs bg-bg">
                  <span
                    className="block h-full bg-muted"
                    style={{ width: `${(entry.count / byActionTotal) * 100}%` }}
                  />
                </span>
                <span className="text-right text-muted">{entry.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-3.5 py-2.5">
        <Label className="mb-2.5 block">{DRAWER_TEXT.requests}</Label>
        {bot.recentRequests.length === 0 ? (
          <p className="m-0 text-xs text-dim">{DRAWER_TEXT.noRequests}</p>
        ) : (
          bot.recentRequests.map((request) => (
            <div
              key={`${request.at}-${request.path}-${request.ms}`}
              className="grid grid-cols-(--grid-request) gap-2.5 border-b border-dashed border-line py-1.25 font-mono text-xs last:border-b-0"
            >
              <span className="text-dim">
                <LocalTime iso={request.at} />
              </span>
              <span
                className="truncate"
                title={`${request.method} ${request.path}`}
              >
                {request.method} {request.path}
              </span>
              <span className={cx("text-right", request.status >= 400 && "text-bad")}>{request.status}</span>
              <span className="text-right text-dim">{request.ms}ms</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DrawerBody;
