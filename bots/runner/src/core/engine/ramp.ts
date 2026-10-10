import type { RampInput, RampPlan } from "@core/interfaces/runnerTypes";

/**
 * The ramp, as a pure decision: bring load bots up toward the target `step` at a time, one step
 * per interval; stop the excess at once when the target drops; stop every one of them when the
 * switch is off. Highest first on the way down, so the same bots stay up from one change to the next.
 */
export function planRamp(input: RampInput): RampPlan {
  const eligible = new Set(input.order);
  // A bot blocked since it came up is no longer in the order: it goes, whatever the target.
  const gone = [...input.spawned].filter((id) => !eligible.has(id));
  const up = input.order.filter((id) => input.spawned.has(id));
  if (!input.enabled) {
    return { spawn: [], despawn: [...gone, ...up.reverse()] };
  }
  if (up.length > input.target) {
    return { spawn: [], despawn: [...gone, ...up.slice(input.target).reverse()] };
  }
  if (!input.stepDue || up.length === input.target) {
    return { spawn: [], despawn: gone };
  }
  const missing = Math.min(input.step, input.target - up.length);
  const spawn = input.order.filter((id) => !input.spawned.has(id)).slice(0, missing);
  return { spawn, despawn: gone };
}
