import type frSpendings from "@text/fr/spendings";

const spendings: typeof frSpendings = {
  noCategory: "uncategorized",
  actions: {
    cancel: "Cancel",
    confirm: "Confirm",
  },
  dashboard: {
    weeklyStats: {
      headerTitle: "totals by period",
      weeklyCeiling: "weekly ceiling",
      weeklySpendings: "average weekly spendings",
    },
    monthlyBudget: {
      initialAmount: "Initial amount",
      remaining: "Remaining",
      total: "Month total",
      percentLabel: "spent",
    },
    monthlyCharts: {
      headerTitle: "monthly breakdown",
    },
    weeklyCharts: {
      headerTitle: "weekly breakdown",
    },
    recurrings: {
      show: "Show recurring",
      hide: "Hide recurring",
    },
  },
  dayItem: {
    remainingBudget: "Maximum daily budget",
  },
  dayCard: {
    noResults: "No results",
    total: "TOTAL",
    addSpending: "Add a spending on this day",
  },
  list: {
    empty: "No spendings",
  },
  sortItem: {
    label: "Label",
    category: "Categories",
    amount: "Amount",
  },
  filter: {
    label: "Filter",
    all: "All",
    // Caret at the end of the one-line category strip; opens the full list overlay.
    showAllAria: "Show all categories",
  },
  toolbar: {
    // Week-scoped client-side filter — distinct from the whole-history search
    // (COS-118), which lives next to it and opens the search modal.
    searchPlaceholder: "Filter the week…",
  },
  view: {
    newSpending: "New spending",
  },
  breakdown: {
    title: "Breakdown by category",
    expandAria: "Show category breakdown",
    collapseAria: "Hide category breakdown",
    expandHint: "Expand to see details",
    // Label of the stacked bar as a whole — the per-category detail is read from
    // the list below it.
    barAria: "Weekly breakdown by category",
    // Suffix appended after the week range label in the pane header.
    rangeSuffix: " · week",
    // Per-category trend badge vs the previous week (COS-35).
    trendStable: "stable",
    trendNew: "new",
  },
  summary: {
    remaining: "Remaining budget",
    weekTotal: "Week total",
    transactions: "Transactions",
    transactionsSub: (perDay: string) => `over 7 days · ${perDay}/day`,
    avgPerDay: "Average / day",
    biggest: "Largest",
    overCeiling: (amount: number) => `+${amount} € vs ceiling`,
    underCeiling: (amount: number) => `−${amount} € under ceiling`,
    ceilingUndefined: "ceiling not set",
    deltaStable: "stable vs last week",
    deltaUp: (amount: number) => `+${amount} € vs last week`,
    deltaDown: (amount: number) => `−${amount} € vs last week`,
  },
  modal: {
    title: {
      edit: (recurring: boolean) => (recurring ? "Edit fixed expense" : "Edit spending"),
      create: (recurring: boolean) => (recurring ? "New fixed expense" : "New spending"),
    },
    submit: {
      save: "Save",
      add: "Add spending",
    },
    recurringToggle: "Monthly recurring",
    attachReceipt: "Attach a receipt",
    fileSize: {
      bytes: "B",
      kilobytes: "KB",
      megabytes: "MB",
    },
    copyPreviousMonth: "Copy fixed expenses from last month",
    fields: {
      amount: "Amount",
      category: "Category",
      date: "Date",
      label: "Label",
      labelPlaceholder: "e.g. Local bakery",
    },
    category: {
      triggerEmpty: "None",
      searchPlaceholder: "Search or type…",
      commandEmpty: "No categories.",
      clearOption: "No category",
      frequent: "Frequent",
    },
    date: {
      prevDayAria: "Previous day",
      nextDayAria: "Next day",
    },
    receipt: {
      dropPrompt: "Drop a receipt or",
      browse: "browse",
      fileTypes: "jpg, png, webp",
      removeAria: "Remove receipt",
    },
    validation: {
      labelRequired: "Label required",
      amountRequired: "Amount required",
    },
  },
  item: {
    deleteConfirm: "Delete this spending?",
    actions: {
      edit: "Edit",
      delete: "Delete",
    },
  },
  txRow: {
    deleteAria: "Confirm deletion",
    receiptAttachedAria: "receipt attached",
    viewReceipt: "View receipt",
    addReceipt: "Add a receipt",
  },
  invoiceModal: {
    noInvoice: "No receipt",
    fileTooBig: "The file is too large",
    chooseFile: "Choose a file",
    fileTypeWarning: "(jpg, png, webp, gif)",
    invalidFileType: "The file is not a valid image",
    send: "Send",
    delete: "Delete receipt",
    enlargeAria: "Enlarge receipt",
    imageAlt: "receipt",
    previewAlt: "receipt preview",
    deleteConfirmTitle: "Delete receipt?",
    lightboxTitle: "Receipt — preview",
  },
  spendingsListModal: {
    total: "total",
    filter: "filter",
    searchPlaceholder: "Search…",
    noCategoryLabel: "uncategorized",
    dayTotal: "Day total",
    cumulativeTotal: "Cumulative total",
    weekWord: "for the week",
    monthWord: "for the month",
    seeWeek: "View the corresponding week",
    noSpendings: "No spendings for this category.",
    noMatch: "No matching spendings.",
    close: "Close",
    // Breakdown of the category by label pattern (PFA-168). "Other" is the
    // catch-all bucket: the labels that match no pattern, plus the folded tail.
    patterns: {
      title: "breakdown by pattern",
      other: "Other",
      showAll: "Show all",
      showLess: "Show less",
    },
  },
  toasts: {
    spendingCreated: "Spending created",
    spendingUpdated: "Spending updated",
    spendingDeleted: "Spending deleted",
    recurringCreated: "Fixed expense created",
    recurringUpdated: "Fixed expense updated",
    recurringDeleted: "Fixed expense deleted",
    recurringsCopied: "Fixed expenses created",
    receiptUploadFailed: "Receipt not attached — retry from the spending row",
  },
};

export default spendings;
