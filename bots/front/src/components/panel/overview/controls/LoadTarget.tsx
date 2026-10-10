"use client";

import useApply from "@components/hooks/useApply";
import PendingBar from "@components/panel/shared/PendingBar";
import Section from "@components/panel/shared/Section";
import SectionLabel from "@components/panel/shared/SectionLabel";
import { cx } from "@lib/classNames/cx";
import { setTarget } from "@lib/panel/panelActions";
import { OVERVIEW_TEXT } from "@text/overview";
import { useState } from "react";

import type { ControlProps } from "@components/panel/overview/interfaces/overviewTypes";

const PRESETS = [0, 10, 50, 120, 250, 500];
const STEP = 10;
const STEPPER =
  "size-11 shrink-0 rounded-ctl border border-line bg-panel2 font-mono text-lg font-medium disabled:cursor-default disabled:opacity-35 tablet:size-8.5";

/**
 * The load-bot target: stepper ±10, presets, capped at the hard limit. An edit shows `old → new`
 * with Cancel / Apply (Enter applies); daily bots are not counted.
 */
const LoadTarget = ({ app, status }: ControlProps) => {
  const { pending, apply } = useApply();
  const max = status.limits.maxBots;
  // null = not editing: the field follows the runner's live value.
  const [draft, setDraft] = useState<number | null>(null);
  const value = draft ?? status.target;
  const dirty = draft !== null && draft !== status.target;
  const text = OVERVIEW_TEXT.target;
  const clamp = (n: number) => Math.max(0, Math.min(max, n));
  const commit = () => {
    if (!dirty) return;
    const next = value;
    apply(() => setTarget(app, next), text.applied(next));
    setDraft(null);
  };

  return (
    <Section>
      <SectionLabel label={text.title}>
        <b className="font-mono text-note font-medium text-text">{text.live(status.liveLoad, status.target)}</b>
      </SectionLabel>
      <div className="flex gap-2">
        <button
          type="button"
          className={STEPPER}
          aria-label={text.decrease}
          disabled={value <= 0}
          onClick={() => setDraft(clamp(value - STEP))}
        >
          −
        </button>
        <input
          inputMode="numeric"
          aria-label={text.title}
          data-testid="target-input"
          value={value}
          onChange={(event) => setDraft(clamp(Number(event.target.value.replace(/\D/g, "") || 0)))}
          onKeyDown={(event) => event.key === "Enter" && commit()}
          className="h-11 min-w-0 flex-1 rounded-ctl border border-line bg-bg px-3 font-mono text-heading font-semibold text-text focus:border-ok-d tablet:h-8.5"
        />
        <button
          type="button"
          className={STEPPER}
          aria-label={text.increase}
          disabled={value >= max}
          onClick={() => setDraft(clamp(value + STEP))}
        >
          +
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 tablet:flex tablet:flex-wrap">
        {PRESETS.filter((preset) => preset <= max).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setDraft(preset)}
            className={cx(
              "h-10 rounded-full border px-2.25 font-mono text-xs tablet:h-6.5",
              value === preset ? "border-ok-d bg-okbg text-ok" : "border-line bg-panel2 text-muted",
            )}
          >
            {preset}
          </button>
        ))}
      </div>
      <p className="m-0 mt-2 font-mono text-xs text-dim">{text.hint(max)}</p>
      {dirty && (
        <PendingBar
          change={`${status.target} → ${value}`}
          onCancel={() => setDraft(null)}
          onApply={commit}
          busy={pending}
        />
      )}
    </Section>
  );
};

export default LoadTarget;
