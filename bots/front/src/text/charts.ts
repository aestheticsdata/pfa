/** The charts' tooltips and detail modals (PFA-229). */
export const CHART_TEXT = {
  hint: "Click for the detail",
  live: "live",
  target: "target",
  p50: "p50",
  p95: "p95",
  requests: "requests",
  actions: "actions",
  errors: "errors",
  other: "other",
  perMin: (value: string) => `${value}/min`,
  bucket: {
    title: (label: string, day: boolean) => (day ? `${label} actions over 24 h` : `${label} actions / min`),
    bots: "bots",
    share: "of live bots",
    busiest: "busiest",
  },
  bucketModal: {
    title: "Bots by activity",
    sub: (label: string, day: boolean, bots: number) =>
      `${day ? `${label} actions over 24 h` : `${label} actions / min`} · ${bots} bot${bots === 1 ? "" : "s"}`,
    none: "No live bot in this bucket.",
    value: (value: number, day: boolean) => (day ? `${value}` : `${value.toFixed(1)}/min`),
  },
  action: {
    runs: "runs",
    share: "share",
    perMin: "rate",
    errorRate: "error rate",
    weight: "weight",
    window: "in the window",
    off: "switched off",
  },
  actionModal: {
    sub: (runs: string) => `since runner start · ${runs} runs`,
    description: "What it does",
    figures: "Figures",
    over: (day: boolean) => (day ? "Runs — last 24 hours, per 15 min" : "Runs — last 80 seconds, per second"),
    flags: { quiet: "paused in quiet hours", budget: "spends the upload budget", off: "switched off" },
    none: "No run in this window.",
  },
  ago: {
    seconds: (n: number) => `${n}s ago`,
    hours: (n: number) => (n === 0 ? "this hour" : `${n}h ago`),
  },
} as const;
