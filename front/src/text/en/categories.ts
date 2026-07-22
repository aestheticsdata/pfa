import type frCategories from "@text/fr/categories";

const categories: typeof frCategories = {
  title: "Categories",
  newCategory: "New category",
  list: {
    searchPlaceholder: "Search for a category…",
    subtitle: "Manage categories · share and frequency",
    subtitleStrong: "across the full history",
    empty: "No categories match.",
    toastCreatedLocal: "Category created locally (mock — not saved)",
  },
  form: {
    editTitle: "Edit category",
    nameLabel: "Name",
    namePlaceholder: "Category name",
    colorLabel: "Color",
    swatchAriaLabel: (hex: string) => `Shade ${hex}`,
    customLabel: "Custom",
    customColorAriaLabel: "Custom color",
    errorNameRequired: "Name is required.",
    errorAlreadyExists: "This category already exists.",
    cancel: "Cancel",
    submitCreate: "Create",
    submitEdit: "Save",
  },
  item: {
    editAction: "Edit name and color",
    deleteAction: "Delete category",
    neverUsed: "new category · never used",
    usage: (count: number) =>
      count === 1 ? "{share} of spendings{dot}{count} time" : "{share} of spendings{dot}{count} times",
    deleteConfirmTitle: (name: string) => `Delete category “${name}”?`,
    deleteConfirmDescription: "This action cannot be undone. Associated spendings will no longer have a category.",
  },
};

export default categories;
