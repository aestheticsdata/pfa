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
    // Comparaison active : la période tracée, puis l'année comparée.
    subtitleCompare: (period: string, compareYear: number) => `${period} · comparé à ${compareYear}`,
    ariaLabel: (year: number) => `Dépenses mensuelles par catégorie ${year}`,
    ariaLabelCompare: (year: number, compareYear: number) =>
      `Dépenses mensuelles par catégorie ${year}, comparées à ${compareYear}`,
    // Cumul de l'année comparée, sous celui de l'année sélectionnée dans la légende.
    compareTotal: (compareYear: number, total: string) => `${total} € en ${compareYear}`,
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
      // The p10–p90 whisker drawn on the bar, then the year's absolute extremes (COS-182).
      typicalRange: "Fourchette habituelle",
      extremes: "Min / max sur l'année",
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
      typicalRange: "fourchette habituelle (8 jours sur 10)",
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
  searchTimeline: {
    title: "Timeline d'une recherche",
    subtitle: "montant et fréquence d'un libellé dans le temps",
    placeholder: "Rechercher un libellé…",
    clear: "Effacer la recherche",
    hint: "Saisir au moins 2 caractères pour voir la répartition d'une dépense dans le temps",
    loading: "Recherche…",
    error: "La recherche a échoué. Réessayer.",
    noResults: "Aucune occurrence sur la période",
    totalSpent: "total dépensé",
    occurrences: "occurrences",
    ranges: {
      month: "1 mois",
      year: "1 an",
      threeYears: "3 ans",
    },
    peakDay: (amount: string, date: string) => `pic : ${amount} € · le ${date}`,
    peakWeek: (amount: string, date: string) => `pic : ${amount} € · sem. du ${date}`,
    // Sentence templates — the {token} carries the figure, highlighted by the
    // component so the three facts of the summary line don't read as one flat run.
    frequencyEvery: "≈ 1 fois tous les {days} jours",
    frequencyDaily: "≈ 1 fois par jour",
    frequencyOnce: "1 seule fois sur la période",
    averageBasket: "{amount} en moyenne",
    lastOn: "dernière le {date}",
    tooltip: {
      weekOf: (date: string) => `Semaine du ${date}`,
      noSpend: "Aucune dépense",
      spendings: (n: number) => `${n} dépense${n > 1 ? "s" : ""}`,
      rolling: (count: number, days: number) => `${count} fois sur ${days} j glissants`,
    },
    windowLabel: (days: number) => `fréquence · ${days} j glissants`,
    windowMax: (n: number) => `max ${n} fois`,
    legendAmount: "montant dépensé",
    legendFrequency: "fréquence",
    barUnit: {
      day: "1 barre = 1 jour",
      week: "1 barre = 1 semaine",
    },
    latestTitle: "Dernières correspondances",
    chartAria: (term: string) => `Répartition dans le temps des dépenses correspondant à « ${term} »`,
  },
};

export default statistics;
