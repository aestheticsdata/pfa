"use client";

import useApply from "@components/hooks/useApply";
import Switch from "@components/ui/Switch";
import { cx } from "@lib/classNames/cx";
import { setDaily } from "@lib/panel/panelActions";
import { OVERVIEW_TEXT } from "@text/overview";

import type { ControlProps } from "@components/panel/overview/interfaces/overviewTypes";

/** "Daily bots ON/OFF" (PFA-202): the permanent bots only — the load bots have their own switch. */
const DailySwitch = ({ app, status }: ControlProps) => {
  const { pending, apply } = useApply();
  const text = OVERVIEW_TEXT.dailySwitch;
  const on = status.dailyEnabled;
  return (
    <div className="flex items-center gap-3.5 p-3.5">
      <div className="flex-1">
        <div className={cx("text-heading font-semibold tracking-figure", on ? "text-ok" : "text-muted")}>
          {on ? text.on : text.off}
        </div>
        <div className="text-note text-dim">{text.sub}</div>
      </div>
      <Switch
        small
        on={on}
        label={text.label}
        disabled={pending}
        testId="daily-switch"
        onToggle={() => apply(() => setDaily(app, !on), on ? text.stopped : text.started)}
      />
    </div>
  );
};

export default DailySwitch;
