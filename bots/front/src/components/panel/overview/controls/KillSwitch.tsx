"use client";

import useApply from "@components/hooks/useApply";
import Switch from "@components/ui/Switch";
import { cx } from "@lib/classNames/cx";
import { setRunning } from "@lib/panel/panelActions";
import { OVERVIEW_TEXT } from "@text/overview";

import type { ControlProps } from "@components/panel/overview/interfaces/overviewTypes";

/** "All bots ON/OFF": stops daily and load bots at once. Applies immediately. */
const KillSwitch = ({ app, status }: ControlProps) => {
  const { pending, apply } = useApply();
  const text = OVERVIEW_TEXT.killSwitch;
  return (
    <div className="flex items-center gap-3.5 p-3.5">
      <div className="flex-1">
        <div className={cx("text-heading font-semibold tracking-figure", status.running ? "text-ok" : "text-muted")}>
          {status.running ? text.on : text.off}
        </div>
        <div className="text-note text-dim">{text.sub}</div>
      </div>
      <Switch
        small
        on={status.running}
        label={text.label}
        disabled={pending}
        testId="kill-switch"
        onToggle={() => apply(() => setRunning(app, !status.running), status.running ? text.stopped : text.started)}
      />
    </div>
  );
};

export default KillSwitch;
