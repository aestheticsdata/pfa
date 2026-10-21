import type { NestApplicationOptions } from "@nestjs/common";

/**
 * How routes are registered and checked (PFA-266, as in the main API's PFA-265).
 *
 * - `specificity`: literal segments are registered before parametric ones, so a literal route
 *   never depends on being declared before its `:id` neighbour.
 * - A duplicate or shadowed route stops the boot. None exists today; the main API has to leave
 *   shadows `off` for deliberate `upload` / `:id` pairs, this one has none to tolerate.
 */
export const ROUTING_OPTIONS = {
  routeResolutionStrategy: "specificity",
  routeConflictPolicy: { duplicate: "error", shadow: "error" },
} as const satisfies NestApplicationOptions;
