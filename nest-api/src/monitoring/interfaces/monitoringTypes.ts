import type { USER_KIND } from "@monitoring/user-kind";

export type UserKind = (typeof USER_KIND)[keyof typeof USER_KIND];
