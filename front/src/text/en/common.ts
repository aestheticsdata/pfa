import type frCommon from "@text/fr/common";

const common: typeof frCommon = {
  deletePopin: {
    confirmLabel: "Confirm deletion?",
    cancel: "Cancel",
    delete: "Delete",
  },
  actions: {
    add: "Add",
    cancel: "Cancel",
    confirm: "Confirm",
    create: "Create",
    delete: "Delete",
    edit: "Edit",
    remove: (name: string) => `Remove ${name}`,
    save: "Save",
  },
  confirmDelete: {
    description: "This action cannot be undone.",
  },
  export: {
    label: "Export",
    toastTitle: "Export coming soon",
    toastDescription: "Available soon.",
  },
  datePicker: {
    placeholder: "Select a period",
  },
  category: {
    uncategorized: "uncategorized",
  },
  validation: {
    tooLong: (max: number) => `${max} characters max`,
  },
  loading: "Loading…",
  searchPlaceholder: "Search…",
  optional: "(optional)",
};

export default common;
