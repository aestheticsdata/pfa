import type { OVERSPEND_LEVEL } from "@components/spendings/config/constants";

export type OverspendLevel = (typeof OVERSPEND_LEVEL)[keyof typeof OVERSPEND_LEVEL];
