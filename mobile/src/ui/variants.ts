export const BUTTON_VARIANT = {
  primary: "primary",
  secondary: "secondary",
  text: "text",
  danger: "danger",
} as const;

/** Badge colours carry meaning: down / under budget, up / over, exceptional, neutral. */
export const BADGE_TONE = {
  positive: "positive",
  negative: "negative",
  exceptional: "exceptional",
  warning: "warning",
  neutral: "neutral",
} as const;

/** `<Amount>` sizes, mapped to the amount type tokens. */
export const AMOUNT_SIZE = {
  xl: "amountXL",
  l: "amountL",
  m: "amountM",
  regular: "amount",
  s: "amountS",
} as const;
