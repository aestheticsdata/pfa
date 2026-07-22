import type frExceptionals from "@text/fr/exceptionals";

const exceptionals: typeof frExceptionals = {
  filters: {
    label: "Filter:",
    allYears: "All years",
    categoryLabel: "Category",
    allCategories: "All",
  },
  actions: {
    add: "Add",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
  },
  item: {
    budgetMonths: "≈ {months} months of regular budget",
    deleteConfirmTitle: (label: string) => `Delete ${label}?`,
  },
  modal: {
    createTitle: "New exceptional expense",
    editTitle: "Edit exceptional expense",
    errors: {
      labelRequired: "Label required",
      amountRequired: "Amount required",
      dateRequired: "Date required",
    },
    fields: {
      date: "Date",
      amount: "Amount (€)",
      label: "Label",
      labelPlaceholder: "E.g. portable air conditioner",
      description: "Description",
      optional: "(optional)",
      descriptionPlaceholder: "E.g. work laptop",
      category: "Category",
    },
    category: {
      nonePlaceholder: "None",
      searchPlaceholder: "Search or create…",
      create: (query: string) => `Create "${query}"`,
      empty: "No categories.",
      noneItem: "No category",
    },
  },
  stats: {
    totalYear: (year: number) => `Total ${year}`,
    totalAllYears: "Total (all years)",
    exceptionalCount: (count: number) => `${count} exceptional expense${count === 1 ? "" : "s"}`,
    averagePerMonth: "Average / month",
    smoothedOver: (spanMonths: number) => `smoothed over ${spanMonths} month${spanMonths === 1 ? "" : "s"}`,
    biggest: "Biggest expense",
    partOfSpending: "Share of spending",
    spentIn: (total: string, year: number) => `of ${total} € spent in ${year}`,
    unavailable: "unavailable",
  },
  list: {
    empty: "No exceptional expenses.",
    purchaseCount: (count: number) => `${count} expense${count === 1 ? "" : "s"}`,
    total: "Total",
  },
  toast: {
    created: "Exceptional expense created",
    updated: "Exceptional expense updated",
    deleted: "Exceptional expense deleted",
  },
};

export default exceptionals;
