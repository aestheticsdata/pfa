const statistics = {
  // Shared "year-to-date" subtitle, rendered identically by the monthly and
  // category charts ("2026 · janv. → juil.").
  ytdSubtitle: (year: number, endMonth: string) => `${year} · janv. → ${endMonth}`,
  // Shared tooltip line splitting a total into its regular vs exceptional parts.
  regExcSplit: (regular: string, exceptional: string) => `Régulier ${regular} € · Exceptionnel ${exceptional} €`,
  miniChart: {
    ariaLabel: "Graphique d'évolution",
    averageShort: "moy.",
  },
  filters: {
    compareTo: "Comparer à",
    exceptionals: "Dépenses exceptionnelles",
    addCategory: "Ajouter une catégorie",
    noCategory: "Aucune catégorie",
  },
  kpis: {
    totalSpent: (year: number) => `Total dépensé ${year}`,
    vsMonths: (compareYear: number, months: number) => `vs ${compareYear} · sur ${months} mois`,
    avgPerMonth: "Moyenne / mois",
    vsAverage: (compareYear: number) => `vs moyenne ${compareYear}`,
    biggestMonth: "Plus gros mois",
    biggestExpense: "Plus grosse dépense",
    regularExpenseFallback: "Dépense courante",
    tag: {
      withExceptional: "avec exceptionnel",
      withoutExceptional: "hors exceptionnel",
      exceptional: "exceptionnelle",
      regular: "courante",
    },
    tooltip: {
      total: (compareYear: number, total: string, diff: string, months: number) =>
        `${compareYear} : ${total} € · ${diff} € sur ${months} mois`,
      avg: (exact: string, total: string, months: number) => `${exact} € · ${total} € ÷ ${months} mois`,
      expenseInfo: (label: string, date: string) => `${label} · ${date}`,
    },
  },
  forecast: {
    spentLabel: (asOf: string) => `Dépensé · 1er janv. → ${asOf}`,
    perDay: (days: number, perDay: string) => `${days} jours · ${perDay} €/jour`,
    startOfYear: "1er janv.",
    endOfYear: "31 déc.",
    projectionAxis: "— projection —",
    projectionTitle: "Projection fin d'année",
    noProjection: "Historique insuffisant",
    vsCompare: (compareYear: number, total: string) => `vs ${compareYear} (${total} €)`,
    tooltip: {
      projectionModel: "Reste de l'année estimé d'après l'historique (même mois N-1) · exceptionnels non extrapolés",
      projectionActual: "Total réalisé sur l'année",
      noProjection: "Aucun historique pour projeter — première période de données",
    },
  },
  monthlyChart: {
    title: "Dépenses mensuelles",
    subtitleCompare: (year: number, compareYear: number) => `${year} comparé à ${compareYear} · ligne pointillée`,
    ariaLabel: (year: number) => `Dépenses mensuelles ${year}`,
    legendExceptional: "Dépense exceptionnelle",
    legendBudget: "Budget mensuel",
    budgetLine: "budget mensuel",
    projection: (amount: string) => `proj. ${amount} €`,
  },
  categoryChart: {
    title: "Dépenses mensuelles par catégorie",
    ariaLabel: (year: number) => `Dépenses mensuelles par catégorie ${year}`,
    tooltipShare: "Part",
    tooltipAmount: "Montant",
    tooltipTrend: "Tendance",
  },
  topCategories: {
    title: "Top catégories",
    meta: (compareYear: number) => `tendance vs ${compareYear}`,
    colCategory: "Catégorie",
    colTotal: "Total",
    colVs: (compareYear: number) => `vs ${compareYear}`,
    new: "nouv.",
    tooltip: {
      trend: (compareYear: number, value: string, diff: string) => `${compareYear} : ${value} € · ${diff} €`,
      newCategory: (compareYear: number) => `Nouvelle catégorie — absente en ${compareYear}`,
    },
  },
  dayOfWeek: {
    title: "Dépenses par jour de la semaine (moyenne sur l'année)",
    meta: (year: number) => `${year}`,
    // Header subtitle tail after the bold year — the year's overall daily rhythm (COS-127).
    subtitle: (avgTx: string, avgAmount: string) => `· ${avgTx} transactions/j · ${avgAmount} €/j en moyenne`,
    days: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    transactionsPerDay: (value: string) => `${value} transactions/j`,
    // Full-height reference line at the year's average daily spend.
    averageLine: (amount: string) => `moy. ${amount} €`,
    // Header insight chips (COS-127) — priciest/cheapest weekday, weekend vs week.
    chips: {
      peak: "Pic",
      trough: "Creux",
      dayAmount: (day: string, amount: string) => `${day} · ${amount} €`,
      weekend: "Week-end",
      weekendVsWeek: "vs semaine",
    },
    // Signed delta % suffix (e.g. the tooltip's Delta badge).
    deltaPct: (pct: string) => `${pct} %`,
    tooltip: {
      range: "Fourchette (semaines)",
      rangeValue: (min: string, max: string) => `${min} € - ${max} €`,
      txPerDay: "Transactions / jour",
      dominantCategory: "Catégorie dominante",
      none: "—",
      // Compared-year row in the tooltip: average amount + average tx/day.
      compareValue: (amount: string, avgTx: string) => `${amount} € · ${avgTx}/j`,
      compareDelta: "Écart",
    },
    legend: {
      under: (budget: string) => `≤ ${budget} €`,
      between: (budget: string, danger: string) => `${budget} – ${danger} €`,
      over: (danger: string) => `> ${danger} €`,
      range: "min – max sur l'année",
      average: "moyenne",
      comparedYear: (year: number) => `année comparée (${year})`,
    },
  },
  fixedExpenses: {
    title: "Dépenses fixes",
    meta: (count: number) => `annualisé · ${count} lignes récurrentes · sans catégorie`,
    annualTotal: "Total sur l'année",
    monthly: "Mensuel",
    drawn: (year: number) => `Déjà prélevé · ${year}`,
    note: (topName: string, topShare: number) =>
      `Les dépenses fixes ne portent pas de catégorie — elles sont totalisées par nom. Le ${topName} représente à lui seul ${topShare} % du total annuel des récurrents.`,
    tooltip: {
      row: (monthly: string) => `${monthly} €/mois`,
    },
  },
  heatmap: {
    title: "Carte de chaleur — quotidienne",
    meta: (year: number, days: number) => `${year} · ${days} jours réalisés`,
    exceptionalPeak: "Pic exceptionnel",
    distributionTitle: "Répartition des journées",
    busiestDay: "Journée la plus chargée",
    excludingExceptional: "hors exceptionnel",
    longestSoberStreak: "Plus longue série sobre",
    streakDays: (days: number) => `${days} jours`,
    calmDays: "journées calmes d'affilée",
    exceptionalPeaks: "Pics exceptionnels",
    dist: {
      sober: "sobres",
      common: "courantes",
      intense: "intenses",
      exceptional: "exceptionnelles",
    },
    tooltip: {
      noSpend: "Aucune dépense",
      exceptionalLead: "Exceptionnel",
      exceptional: (label: string, amount: string) => `${label} · ${amount} €`,
      distSegment: (n: number, label: string, pct: string) => `${n} journées ${label} · ${pct} %`,
    },
  },
};

export default statistics;
