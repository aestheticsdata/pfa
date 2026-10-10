"use client";

import useApply from "@components/hooks/useApply";
import Section from "@components/panel/shared/Section";
import SectionLabel from "@components/panel/shared/SectionLabel";
import { LOAD_PACE } from "@contracts/panel";
import { cx } from "@lib/classNames/cx";
import { setLoadPace } from "@lib/panel/panelActions";
import { OVERVIEW_TEXT } from "@text/overview";

import type { ControlProps } from "@components/panel/overview/interfaces/overviewTypes";

const PACES = [LOAD_PACE.daily, LOAD_PACE.burst];

/**
 * How the load bots behave (PFA-128): like real users, or a stress test. Applies at once; the bots
 * already up take the new pace from their next visit. The label shows the visit pool in use.
 */
const LoadPace = ({ app, status }: ControlProps) => {
  const { pending, apply } = useApply();
  const text = OVERVIEW_TEXT.pace;
  const name = (pace: string) => (pace === LOAD_PACE.burst ? text.burst : text.daily);
  return (
    <Section>
      <SectionLabel label={text.title}>
        <b className="font-mono text-note font-medium text-text">
          {text.visits(status.activeVisits, status.maxActiveVisits)}
        </b>
      </SectionLabel>
      <div className="grid grid-cols-2 gap-1.5 tablet:flex">
        {PACES.map((pace) => (
          <button
            key={pace}
            type="button"
            disabled={pending}
            aria-pressed={status.loadPace === pace}
            onClick={() => status.loadPace !== pace && apply(() => setLoadPace(app, pace), text.applied(name(pace)))}
            className={cx(
              "h-10 rounded-full border px-3.5 font-mono text-xs disabled:cursor-default tablet:h-6.5",
              status.loadPace === pace ? "border-ok-d bg-okbg text-ok" : "border-line bg-panel2 text-muted",
            )}
          >
            {name(pace)}
          </button>
        ))}
      </div>
      <p className="m-0 mt-2 font-mono text-xs text-dim">
        {status.loadPace === LOAD_PACE.burst ? text.hintBurst : text.hintDaily}
      </p>
    </Section>
  );
};

export default LoadPace;
