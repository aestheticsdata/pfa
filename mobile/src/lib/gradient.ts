import type { GradientPoints } from "@lib/interfaces/gradientTypes";

const DEGREES_TO_RADIANS = Math.PI / 180;

/** Rounds away float noise (cos 90° is 6e-17, not 0) so the points read cleanly in tests and logs. */
const clean = (value: number) => Math.round(value * 1e6) / 1e6;

/**
 * A CSS `linear-gradient(<angle>deg, …)` as expo-linear-gradient's `start` / `end` points, in the
 * unit square. CSS angles start at "to top" (0°) and turn clockwise: 90° is left → right.
 */
export const gradientPoints = (angle: number): GradientPoints => {
  const radians = angle * DEGREES_TO_RADIANS;
  const dx = Math.sin(radians) / 2;
  const dy = -Math.cos(radians) / 2;
  return {
    start: { x: clean(0.5 - dx), y: clean(0.5 - dy) },
    end: { x: clean(0.5 + dx), y: clean(0.5 + dy) },
  };
};
