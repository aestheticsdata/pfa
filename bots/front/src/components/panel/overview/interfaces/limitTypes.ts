export interface LimitRowProps {
  label: string;
  value: string;
  /** The env variable it comes from, and its current use. */
  keyLine: string;
  /** Used share of the cap, 0–1. */
  share: number;
  warn?: boolean;
}
