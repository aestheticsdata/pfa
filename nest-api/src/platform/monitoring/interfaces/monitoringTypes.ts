import type { USER_KIND } from "@monitoring/user-kind";

export type UserKind = (typeof USER_KIND)[keyof typeof USER_KIND];

/** One served request, as the HTTP metrics record it (PFA-212). */
export interface HttpObservation {
  method: string;
  route: string;
  statusCode: number;
  seconds: number;
}
