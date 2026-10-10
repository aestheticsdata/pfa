/** The setup rules, checked before the API is asked (it checks them again). */
export const AUTH_RULES = {
  passwordMin: 12,
  passphraseMinWords: 4,
} as const;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}
