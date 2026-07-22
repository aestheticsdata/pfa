import type frStatistics from "@text/fr/statistics";

const statistics: typeof frStatistics = {
  // Shared "year-to-date" subtitle, rendered identically by the monthly and
  // category charts ("2026 · Jan → Jul").
  ytdSubtitle: (year: number, endMonth: string) => `${year} · Jan → ${endMonth}`,
  // Shared tooltip line splitting a total into its regular vs exceptional parts.
  regExcSplit: (regular: string, exceptional: string) => `Regular ${regular} € · Exceptional ${exceptional} €`,
  miniChart: {
    ariaLabel: "Trend chart",
    averageShort: "avg.",
  },
  filters: {
    compareTo: "Compare to",
    exceptionals: "Exceptional expenses",
    addCategory: "Add a category",
    noCategory: "No category",
  },
  kpis: {
    totalSpent: (year: number) => `Total spent ${year}`,
    vsMonths: (compareYear: number, months: number) =>
      `vs ${compareYear} · over ${months} month${months === 1 ? "" : "s"}`,
    avgPerMonth: "Average / month",
    vsAverage: (compareYear: number) => `vs ${compareYear} average`,
    biggestMonth: "Biggest month",
    biggestExpense: "Biggest expense",
    regularExpenseFallback: "Regular expense",
    tag: {
      withExceptional: "with exceptional",
      withoutExceptional: "excluding exceptional",
      exceptional: "exceptional",
      regular: "regular",
    },
    tooltip: {
      total: (compareYear: number, total: string, diff: string, months: number) =>
        `${compareYear}: ${total} € · ${diff} € over ${months} month${months === 1 ? "" : "s"}`,
      avg: (exact: string, total: string, months: number) =>
        `${exact} € · ${total} € ÷ ${months} month${months === 1 ? "" : "s"}`,
      expenseInfo: (label: string, date: string) => `${label} · ${date}`,
    },
  },
  forecast: {
    spentLabel: (asOf: string) => `Spent · Jan 1 → ${asOf}`,
    perDay: (days: number, perDay: string) => `${days} day${days === 1 ? "" : "s"} · ${perDay} €/day`,
    startOfYear: "Jan 1",
    endOfYear: "Dec 31",
    projectionAxis: "— projection —",
    projectionTitle: "Year-end projection",
    noProjection: "Not enough history",
    vsCompare: (compareYear: number, total: string) => `vs ${compareYear} (${total} €)`,
    tooltip: {
      projectionModel: "Rest of the year estimated from history (same month last year) · exceptionals not extrapolated",
      projectionActual: "Actual total for the year",
      noProjection: "No history to project from — first period of data",
    },
  },
  monthlyChart: {
    title: "Monthly spendings",
    subtitleCompare: (year: number, compareYear: number) => `${year} compared to ${compareYear} · dotted line`,
    ariaLabel: (year: number) => `Monthly spendings ${year}`,
    legendExceptional: "Exceptional expense",
    legendBudget: "Monthly budget",
    budgetLine: "monthly budget",
    projection: (amount: string) => `proj. ${amount} €`,
  },
  categoryChart: {
    title: "Monthly spendings by category",
    ariaLabel: (year: number) => `Monthly spendings by category ${year}`,
    tooltipShare: "Share",
    tooltipAmount: "Amount",
    tooltipTrend: "Trend",
  },
  topCategories: {
    title: "Top categories",
    meta: (compareYear: number) => `trend vs ${compareYear}`,
    colCategory: "Category",
    colTotal: "Total",
    colVs: (compareYear: number) => `vs ${compareYear}`,
    new: "new",
    tooltip: {
      trend: (compareYear: number, value: string, diff: string) => `${compareYear}: ${value} € · ${diff} €`,
      newCategory: (compareYear: number) => `New category — absent in ${compareYear}`,
    },
  },
  dayOfWeek: {
    title: "Spendings by day of the week (average over the year)",
    meta: (year: number) => `${year}`,
    // Header subtitle tail after the bold year — the year's overall daily rhythm (COS-127).
    subtitle: (avgTx: string, avgAmount: string) => `· ${avgTx} transactions/day · ${avgAmount} €/day on average`,
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    transactionsPerDay: (value: string) => `${value} transactions/day`,
    // Full-height reference line at the year's average daily spend.
    averageLine: (amount: string) => `avg. ${amount} €`,
    // Header insight chips (COS-127) — priciest/cheapest weekday, weekend vs week.
    chips: {
      peak: "Peak",
      trough: "Low",
      dayAmount: (day: string, amount: string) => `${day} · ${amount} €`,
      weekend: "Weekend",
      weekendVsWeek: "vs weekdays",
    },
    // Signed delta % suffix (e.g. the tooltip's Delta badge).
    deltaPct: (pct: string) => `${pct}%`,
    tooltip: {
      range: "Range (weeks)",
      rangeValue: (min: string, max: string) => `${min} € - ${max} €`,
      txPerDay: "Transactions / day",
      dominantCategory: "Dominant category",
      none: "—",
      // Compared-year row in the tooltip: average amount + average tx/day.
      compareValue: (amount: string, avgTx: string) => `${amount} € · ${avgTx}/day`,
      compareDelta: "Delta",
    },
    legend: {
      under: (budget: string) => `≤ ${budget} €`,
      between: (budget: string, danger: string) => `${budget} – ${danger} €`,
      over: (danger: string) => `> ${danger} €`,
      range: "min – max over the year",
      average: "average",
      comparedYear: (year: number) => `compared year (${year})`,
    },
  },
  fixedExpenses: {
    title: "Fixed expenses",
    meta: (count: number) => `annualized · ${count} recurring line${count === 1 ? "" : "s"} · no category`,
    annualTotal: "Total for the year",
    monthly: "Monthly",
    drawn: (year: number) => `Already debited · ${year}`,
    note: (topName: string, topShare: number) =>
      `Fixed expenses carry no category — they are totaled by name. ${topName} alone accounts for ${topShare}% of the annual recurring total.`,
    tooltip: {
      row: (monthly: string) => `${monthly} €/month`,
    },
  },
  heatmap: {
    title: "Heatmap — daily",
    meta: (year: number, days: number) => `${year} · ${days} day${days === 1 ? "" : "s"} elapsed`,
    exceptionalPeak: "Exceptional peak",
    distributionTitle: "Day distribution",
    busiestDay: "Busiest day",
    excludingExceptional: "excluding exceptional",
    longestSoberStreak: "Longest calm streak",
    streakDays: (days: number) => `${days} day${days === 1 ? "" : "s"}`,
    calmDays: "calm days in a row",
    exceptionalPeaks: "Exceptional peaks",
    dist: {
      sober: "calm",
      common: "regular",
      intense: "intense",
      exceptional: "exceptional",
    },
    tooltip: {
      noSpend: "No spending",
      exceptionalLead: "Exceptional",
      exceptional: (label: string, amount: string) => `${label} · ${amount} €`,
      distSegment: (n: number, label: string, pct: string) => `${n} ${label} day${n === 1 ? "" : "s"} · ${pct}%`,
    },
  },
  searchTimeline: {
    title: "Search timeline",
    subtitle: "amount and frequency of a label over time",
    placeholder: "Search a label…",
    clear: "Clear the search",
    hint: "Type at least 2 characters to see how a spending spreads over time",
    loading: "Searching…",
    error: "Search failed. Try again.",
    noResults: "No occurrence over the period",
    totalSpent: "total spent",
    occurrences: "occurrences",
    ranges: {
      month: "1 month",
      year: "1 year",
      threeYears: "3 years",
    },
    peakDay: (amount: string, date: string) => `peak: ${amount} € · on ${date}`,
    peakWeek: (amount: string, date: string) => `peak: ${amount} € · week of ${date}`,
    // Sentence templates — the {token} carries the figure, highlighted by the
    // component so the three facts of the summary line don't read as one flat run.
    frequencyEvery: "≈ once every {days} days",
    frequencyDaily: "≈ once a day",
    frequencyOnce: "just once over the period",
    averageBasket: "{amount} on average",
    lastOn: "last on {date}",
    tooltip: {
      weekOf: (date: string) => `Week of ${date}`,
      noSpend: "No spending",
      spendings: (n: number) => `${n} spending${n > 1 ? "s" : ""}`,
      rolling: (count: number, days: number) => `${count} times over ${days} rolling days`,
    },
    windowLabel: (days: number) => `frequency · ${days}-day rolling`,
    windowMax: (n: number) => `max ${n} times`,
    legendAmount: "amount spent",
    legendFrequency: "frequency",
    barUnit: {
      day: "1 bar = 1 day",
      week: "1 bar = 1 week",
    },
    latestTitle: "Latest matches",
    chartAria: (term: string) => `Time distribution of the spendings matching "${term}"`,
  },
};

export default statistics;
