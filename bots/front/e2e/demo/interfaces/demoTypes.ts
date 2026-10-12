import type { Page } from "@playwright/test";
import type { AIM, VERB } from "../vocabulary";

/** The harness's shared shapes. */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The element a gesture was aimed at, as the edit addresses it. */
export interface Target {
  /** The element's `data-testid`, or its nearest ancestor's: the family. */
  testid: string | null;
  /** Its other `data-*` attributes, prefix dropped: the member (`route`, `category`…). */
  data: Record<string, string>;
  /** Playwright's own description of the locator, for a human reading the log. */
  selector: string;
  /** Where it was drawn when the pointer reached it. */
  box: Box;
}

/** The storyboard's verbs, plus `mark`: where an element is, noted for the edit with no pointer and no time. */
export type Verb = (typeof VERB)[keyof typeof VERB];

export interface Gesture {
  verb: Verb;
  start: number;
  end: number;
  target?: Target;
  /** What was typed, for `fill` and `type`; the key's name, for `press`. */
  text?: string;
  /** Where a `glide` went: the donut and the bars hit-test a point, not an element. */
  point?: { x: number; y: number };
  /** How far a `scroll` wheeled, in CSS pixels. */
  distance?: number;
}

/** One press of the button: down, then up. */
export interface Press {
  at: number;
  release: number;
  x: number;
  y: number;
}

/** One character typed, or one named key pressed. */
export interface Key {
  at: number;
  key: string;
}

export interface EventLogMeta {
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
  /** Frame pixels per CSS pixel in the mp4, measured off its frames — see `jpegSize` in `recorder.ts`. */
  captureScale: number;
  durationMs: number;
  chapters: { title: string; atMs: number }[];
}

export interface EventLogFile extends EventLogMeta {
  version: 1;
  /** `[ms, x, y]` per pointer step: ~50 a second while it travels, none while it rests. */
  pointer: [number, number, number][];
  presses: Press[];
  keys: Key[];
  gestures: Gesture[];
}

/** Where on a target the pointer should land. */
export type Aim = (typeof AIM)[keyof typeof AIM];

export interface GestureOptions {
  /** `text` aims near the leading edge — a full-width row is not clicked in the middle. */
  aim?: Aim;
  /** Extra reading time after the gesture, on top of the standard settle. */
  dwell?: number;
}

export interface Mark {
  title: string;
  atMs: number;
}

/**
 * What a still may do to the page before the shutter, once the revisit has
 * settled: open a modal, type into the palette, pick files. It drives the real
 * page — `page.mouse`, `page.keyboard`, plain locators — never the drawn
 * pointer, which is painted out of the picture anyway. See `Demo.shot()`.
 */
export type Prepare = (page: Page) => Promise<void>;
