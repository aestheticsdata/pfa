import { cloneElement, isValidElement } from "react";

import type { ReactNode } from "react";

/**
 * Renders a dictionary sentence template — "{perDay}/day left until {date}." —
 * substituting each {token} with the (usually styled) node supplied by the
 * component. One key per sentence: word order lives in the dictionary, markup
 * stays in the JSX. An unmatched token renders literally, so a typo is visible
 * on screen instead of silently dropped.
 */
export const interpolate = (template: string, values: Record<string, ReactNode>): ReactNode[] => {
  const occurrences: Record<string, number> = {};
  return template
    .split(/(\{[a-zA-Z0-9_]+\})/g)
    .filter(Boolean)
    .map((part) => {
      const token = /^\{([a-zA-Z0-9_]+)\}$/.exec(part);
      if (!token) return part;
      const value = values[token[1]];
      if (value === undefined) return part;
      // Key from the token name (+ occurrence for repeats) — stable per template.
      occurrences[token[1]] = (occurrences[token[1]] ?? 0) + 1;
      return isValidElement(value) ? cloneElement(value, { key: `${token[1]}-${occurrences[token[1]]}` }) : value;
    });
};
