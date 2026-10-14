/** The series colours the Metrics charts, their legends and their tooltips share (PFA-229). */
export const CHART_COLOR = {
  live: "var(--ok)",
  target: "var(--dim)",
  p50: "var(--info)",
  p95: "var(--warn)",
  codes2xx: "color-mix(in oklch, var(--ok) 50%, transparent)",
  codes4xx: "var(--warn)",
  codes5xx: "var(--bad)",
  actions: "color-mix(in oklch, var(--ok) 50%, transparent)",
  errors: "var(--bad)",
  other: "var(--faint)",
} as const;
