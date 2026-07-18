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
    vsCompare: (compareYear: number, total: string) => `vs ${compareYear} (${total} €)`,
    tooltip: {
      projectionModel: (perDay: string, days: number) => `Au rythme actuel · ${perDay} €/jour × ${days} jours`,
      projectionActual: "Total réalisé sur l'année",
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
    title: "Dépenses par jour de la semaine",
    meta: "moyenne sur 12 mois",
    transactionsPerDay: (value: string) => `${value} transactions/j`,
  },
  fixedExpenses: {
    title: "Dépenses fixes",
    meta: (count: number) => `annualisé · ${count} lignes récurrentes · sans catégorie`,
    annualTotal: "Total sur l'année",
    monthly: "Mensuel",
    drawn: (date: string) => `Déjà prélevé · au ${date}`,
    note: (topName: string, topShare: number) =>
      `Les dépenses fixes ne portent pas de catégorie — elles sont totalisées par nom. Le ${topName} représente à lui seul ${topShare} % du total annuel des récurrents.`,
    tooltip: {
      row: (monthly: string, day: number) => `${monthly} €/mois · prélevé le ${day}`,
      drawn:
        "Estimation : une ligne est comptée prélevée si son jour de prélèvement (jour du mois de la date de début) est passé.",
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
