export interface RateLimitHit {
  limited: boolean;
  count: number;
  retryAfterSec: number;
}
