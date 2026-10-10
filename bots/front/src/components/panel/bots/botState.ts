import { TONE } from "@components/ui/variants";
import { BOT_VIEW_STATE } from "@contracts/panel";

import type { Tone } from "@components/ui/interfaces/uiTypes";

const TONES: Record<string, Tone> = {
  [BOT_VIEW_STATE.running]: TONE.ok,
  [BOT_VIEW_STATE.degraded]: TONE.warn,
  [BOT_VIEW_STATE.blocked]: TONE.bad,
};

/** The dot colour of a bot state: green running, amber degraded, red blocked, grey otherwise. */
export const stateTone = (state: string): Tone => TONES[state] ?? TONE.neutral;

export const isLive = (state: string): boolean => state === BOT_VIEW_STATE.running || state === BOT_VIEW_STATE.degraded;
