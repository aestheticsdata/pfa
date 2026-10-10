"use client";

import useApply from "@components/hooks/useApply";
import PendingBar from "@components/panel/shared/PendingBar";
import Section from "@components/panel/shared/Section";
import SectionLabel from "@components/panel/shared/SectionLabel";
import { FIELD_CLASSES } from "@components/ui/fieldClasses";
import Label from "@components/ui/Label";
import { cx } from "@lib/classNames/cx";
import { setQuietHours } from "@lib/panel/panelActions";
import {
  crossesMidnight,
  isApplicable,
  maskClock,
  offsetLabel,
  QUIET_ERROR,
  quietError,
  shiftWindow,
  zoneAbbreviation,
  zoneOffsetMinutes,
} from "@lib/panel/quietHours";
import { OVERVIEW_TEXT } from "@text/overview";
import { useState } from "react";

import type { QuietHoursProps } from "@components/panel/overview/interfaces/overviewTypes";
import type { QuietWindow } from "@lib/panel/interfaces/quietTypes";

const DEFAULT_WINDOW: QuietWindow = { from: "22:00", to: "10:00" };
const ZONE = { app: "app", utc: "utc" } as const;

/**
 * No new spendings in this daily window (handoff v3). Stored on the app's clock; the CEST | UTC
 * switch only changes what is shown and typed. Same pending bar as the load target.
 */
const QuietHours = ({ app, quiet }: QuietHoursProps) => {
  const { pending, apply } = useApply();
  const [utc, setUtc] = useState(false);
  const [draft, setDraft] = useState<QuietWindow | null>(null);
  const text = OVERVIEW_TEXT.quiet;
  const now = new Date();
  const offset = zoneOffsetMinutes(quiet.tz, now);
  const abbreviation = zoneAbbreviation(quiet.tz, now);
  const toDisplay = (window: QuietWindow) => (utc ? shiftWindow(window, -offset) : window);
  const stored = toDisplay({ from: quiet.from, to: quiet.to });
  const shown = draft ?? stored;
  const error = quietError(shown);
  const dirty = draft !== null && (draft.from !== stored.from || draft.to !== stored.to);
  const defaults = toDisplay(DEFAULT_WINDOW);
  const zoneName = utc ? text.utc : abbreviation;

  const switchZone = (toUtc: boolean) => {
    if (toUtc === utc) return;
    if (draft) setDraft(shiftWindow(draft, toUtc ? -offset : offset));
    setUtc(toUtc);
  };
  const commit = () => {
    if (!dirty || !draft || !isApplicable(draft)) return;
    const window = utc ? shiftWindow(draft, offset) : draft;
    apply(() => setQuietHours({ app, ...window }), text.applied(draft.from, draft.to, zoneName));
    setDraft(null);
  };
  const edit = (end: keyof QuietWindow, value: string) => setDraft({ ...shown, [end]: maskClock(value) });

  return (
    <Section>
      <SectionLabel label={text.title}>
        <span className="flex items-center gap-2">
          <b className="font-mono text-note font-medium text-text">
            {quiet.active ? text.activeUntil(stored.to) : text.startsAt(stored.from)}
          </b>
          <fieldset
            aria-label={text.zone}
            className="m-0 inline-flex min-w-0 rounded-ctl border border-line p-0"
          >
            {[
              { key: ZONE.app, label: abbreviation, on: !utc },
              { key: ZONE.utc, label: text.utc, on: utc },
            ].map((option, index) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={option.on}
                onClick={() => switchZone(option.key === ZONE.utc)}
                className={cx(
                  "h-5 px-1.75 font-mono text-tiny max-tablet:hit-area",
                  index > 0 && "border-l border-line",
                  option.on ? "bg-okbg text-ok" : "text-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </fieldset>
        </span>
      </SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        {(["from", "to"] as const).map((end) => (
          <label
            key={end}
            className="flex flex-col gap-1.5"
          >
            <span className="flex justify-between gap-2">
              <Label>{end === "from" ? text.from : text.to}</Label>
              {end === "to" && crossesMidnight(shown) && (
                <span className="font-mono text-tiny text-dim">{text.nextDay}</span>
              )}
            </span>
            <input
              inputMode="numeric"
              placeholder="HH:MM"
              maxLength={5}
              aria-invalid={error ? true : undefined}
              data-testid={`quiet-${end}`}
              className={FIELD_CLASSES}
              value={shown[end]}
              onChange={(event) => edit(end, event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && commit()}
            />
          </label>
        ))}
      </div>
      {error && (
        <p className="m-0 mt-1.25 text-xs text-bad">{error === QUIET_ERROR.same ? text.mustDiffer : text.badClock}</p>
      )}
      <p className="m-0 mt-2 font-mono text-xs text-dim">
        {utc ? text.hintUtc(quiet.tz, offsetLabel(offset)) : text.hint(quiet.tz)} ·{" "}
        {text.defaultIs(defaults.from, defaults.to)}
      </p>
      {dirty && draft && isApplicable(draft) && (
        <PendingBar
          change={`${stored.from} → ${stored.to}  ⟶  ${draft.from} → ${draft.to}`}
          onCancel={() => setDraft(null)}
          onApply={commit}
          busy={pending}
        />
      )}
    </Section>
  );
};

export default QuietHours;
