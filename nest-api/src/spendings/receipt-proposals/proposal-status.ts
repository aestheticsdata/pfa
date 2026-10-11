/** Where a bulk-read receipt stands (PFA-223). */
export const PROPOSAL_STATUS = {
  queued: "queued",
  ready: "ready",
  failed: "failed",
  skipped: "skipped",
} as const;
