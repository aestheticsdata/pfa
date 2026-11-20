import type { type } from "@theme/tokens";
import type { AMOUNT_SIZE, BADGE_TONE, BUTTON_VARIANT } from "@ui/variants";
import type { ReactNode } from "react";

export type TextVariant = keyof typeof type;

export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export type BadgeTone = (typeof BADGE_TONE)[keyof typeof BADGE_TONE];

export type AmountSize = (typeof AMOUNT_SIZE)[keyof typeof AMOUNT_SIZE];

/** One option of a segmented control. */
export interface SegmentOption<Value extends string> {
  value: Value;
  label: string;
}

/** A tab of the app's bar: its route name, label and icon. */
export interface TabItem {
  name: string;
  label: string;
  icon: (color: string) => ReactNode;
}
