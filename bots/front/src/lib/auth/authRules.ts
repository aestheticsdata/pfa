/** The setup rules, checked before the API is asked (it checks them again). */
export const AUTH_RULES = {
  passwordMin: 12,
} as const;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
