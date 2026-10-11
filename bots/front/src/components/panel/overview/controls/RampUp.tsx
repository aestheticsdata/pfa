"use client";

import useApply from "@components/hooks/useApply";
import Section from "@components/panel/shared/Section";
import SectionLabel from "@components/panel/shared/SectionLabel";
import { FIELD_CLASSES } from "@components/ui/fieldClasses";
import Label from "@components/ui/Label";
import { countdown } from "@lib/format/format";
import { setRamp } from "@lib/panel/panelActions";
import { OVERVIEW_TEXT } from "@text/overview";
import { useState } from "react";

import type { ControlProps } from "@components/panel/overview/interfaces/overviewTypes";

const EVERY = [10, 30, 60, 120, 300];
const everyLabel = (seconds: number) => (seconds >= 60 ? `${seconds / 60} min` : `${seconds} s`);

/**
 * How load bots come up: `step` more every `every`. The interval applies on change; the step on
 * Enter or when the field is left. Scale-down is immediate.
 */
const RampUp = ({ app, status }: ControlProps) => {
  const { apply } = useApply();
  const { ramp, target, spawned, nextStepInSec, loadEnabled } = status;
  const [stepDraft, setStepDraft] = useState<string | null>(null);
  const text = OVERVIEW_TEXT.ramp;
  const behind = Math.max(0, target - spawned);
  const eta =
    loadEnabled && behind > 0 && nextStepInSec !== null
      ? (Math.ceil(behind / ramp.step) - 1) * ramp.everySec + nextStepInSec
      : null;
  const save = (step: number, everySec: number) => apply(() => setRamp({ app, step, everySec }), text.applied);
  const commitStep = () => {
    if (stepDraft === null) return;
    const step = Math.max(1, Math.min(status.limits.maxBots, Number(stepDraft) || 1));
    setStepDraft(null);
    if (step !== ramp.step) save(step, ramp.everySec);
  };

  return (
    <Section>
      <SectionLabel label={text.title}>
        <b className="font-mono text-note font-medium text-text">
          {eta !== null ? text.eta(countdown(eta)) : loadEnabled ? text.atTarget : "—"}
        </b>
      </SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1.5">
          <Label>{text.step}</Label>
          <input
            inputMode="numeric"
            className={FIELD_CLASSES}
            value={stepDraft ?? ramp.step}
            onChange={(event) => setStepDraft(event.target.value.replace(/\D/g, ""))}
            onBlur={commitStep}
            onKeyDown={(event) => event.key === "Enter" && commitStep()}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <Label>{text.every}</Label>
          <select
            className={FIELD_CLASSES}
            value={ramp.everySec}
            onChange={(event) => save(ramp.step, Number(event.target.value))}
          >
            {EVERY.map((seconds) => (
              <option
                key={seconds}
                value={seconds}
              >
                {everyLabel(seconds)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-xs bg-bg">
        <span
          className="absolute inset-y-0 left-0 rounded-xs bg-ok transition-[width] duration-600"
          style={{ width: `${target ? (Math.min(spawned, target) / target) * 100 : 0}%` }}
        />
      </div>
      <p className="m-0 mt-2 font-mono text-xs text-dim">
        {loadEnabled && behind > 0
          ? `${text.progress(spawned, target, Math.min(ramp.step, behind))}${nextStepInSec !== null ? ` in ${nextStepInSec}s` : ""}`
          : text.done(Math.min(spawned, target), target)}
      </p>
    </Section>
  );
};

export default RampUp;
