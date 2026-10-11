"use client";

import useApply from "@components/hooks/useApply";
import Switch from "@components/ui/Switch";
import { cx } from "@lib/classNames/cx";
import { setLoad } from "@lib/panel/panelActions";
import { OVERVIEW_TEXT } from "@text/overview";

import type { ControlProps } from "@components/panel/overview/interfaces/overviewTypes";

/**
 * "Load bots ON/OFF" (PFA-128): stops every load bot at once and keeps the target, so switching
 * back on ramps to it again. The daily bots are not touched — they have their own switch.
 */
const LoadSwitch = ({ app, status }: ControlProps) => {
  const { pending, apply } = useApply();
  const text = OVERVIEW_TEXT.loadSwitch;
  const on = status.loadEnabled;
  return (
    <div className="flex items-center gap-3.5 border-t border-line-soft p-3.5">
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
        testId="load-switch"
        onToggle={() => apply(() => setLoad(app, !on), on ? text.stopped : text.started(status.target))}
      />
    </div>
  );
};

export default LoadSwitch;
