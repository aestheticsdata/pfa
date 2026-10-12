/**
 * The clock the demo runs on.
 *
 * A demo is not a test: here the pauses *are* the content. Every duration the
 * run spends on screen is declared in this one table rather than sprinkled
 * through the scenario, because retiming the whole video means moving these
 * numbers — and because a 90-second budget is only knowable if the beats are
 * countable in the first place.
 *
 * `DEMO_SPEED` scales all of it at once: 1.25 tightens a take that came out
 * long, 0.8 slows one that reads as rushed. It never changes the order or the
 * number of beats, so the chapter list survives a retime.
 */

export const SPEED = Number(process.env.DEMO_SPEED ?? 1) || 1;

/** Every on-screen duration, before `SPEED` is applied. Milliseconds. */
export const PACE = {
  /** A short pointer hop, and a full traverse of the window. */
  glideShort: 240,
  glideLong: 620,
  /** The hesitation between arriving on a target and pressing it. */
  aim: 130,
  /** After a click lands: long enough for the eye to register what changed. */
  settle: 280,
  /** Reading time on the thing a beat exists to show. */
  dwell: 850,
  /** A page transition the viewer should perceive as one. */
  navigate: 520,
  /** Between keystrokes, before jitter. */
  keystroke: 56,
  /** One trackpad flick. */
  scroll: 950,
  /** Pointer path frame interval — 50fps, above the 25fps the video records. */
  frame: 20,
} as const;

/** A duration in demo time. Everything on screen goes through here. */
export function ms(base: number) {
  return Math.max(0, Math.round(base / SPEED));
}

export function sleep(base: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms(base)));
}

/**
 * How long the pointer should take to cross a given distance.
 *
 * Square-rooted rather than linear, the way a hand actually behaves: a flick
 * across the window is not five times slower than a hop between two rows, it
 * is roughly twice.
 */
export function glideMs(distance: number) {
  const t = Math.min(1, Math.sqrt(distance) / 32);
  return PACE.glideShort + (PACE.glideLong - PACE.glideShort) * t;
}

/** Ease-in-out cubic: a hand accelerates away and decelerates into a target. */
export function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Jitter, from a fixed seed.
 *
 * Typing at a metronome-exact 56ms reads as a machine, so the keystrokes are
 * scattered — but scattered the *same way* on every take, because two runs of
 * the same scenario should be cuttable against each other. `Math.random` would
 * make every take a different length.
 */
let seed = 0x2f6e2b1;

export function jitter() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

export function resetJitter() {
  seed = 0x2f6e2b1;
}
