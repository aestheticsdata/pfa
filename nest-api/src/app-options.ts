import type { NestApplicationOptions } from "@nestjs/common";

/**
 * How routes are registered and checked (PFA-265), shared by `main.ts` and the e2e app so the
 * suites boot exactly what production boots.
 *
 * - `specificity`: literal segments are registered before parametric ones, so `DELETE
 *   /spendings/upload` reaches its handler whatever the declaration order beside `:id`.
 * - A duplicate route (same method and path twice) stops the boot.
 * - Shadows are not reported: the detector ignores the strategy and flags the overlaps it
 *   resolves on purpose — `upload` and `groups` beside `:id` under `/spendings`, where an ID is a
 *   UUID and never one of those words.
 */
export const ROUTING_OPTIONS = {
  routeResolutionStrategy: "specificity",
  routeConflictPolicy: { duplicate: "error", shadow: "off" },
} as const satisfies NestApplicationOptions;
