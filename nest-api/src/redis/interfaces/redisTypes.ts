/** Signed-in sessions currently held in Redis, split between people and synthetic bots. */
export interface SessionCounts {
  real: number;
  synthetic: number;
}
