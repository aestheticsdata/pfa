import { QUERY_KEYS } from "@lib/query/keys";

// What the management dialog of the Prix page manages (PFA-224).
export const CATALOG_KIND = { stores: "stores", productTypes: "productTypes" } as const;

export const CATALOG_ENDPOINT = {
  [CATALOG_KIND.stores]: "/stores",
  [CATALOG_KIND.productTypes]: "/product-types",
} as const;

export const CATALOG_QUERY_KEY = {
  [CATALOG_KIND.stores]: QUERY_KEYS.STORES,
  [CATALOG_KIND.productTypes]: QUERY_KEYS.PRODUCT_TYPES,
} as const;

// The usage listing sits under the kind's own key, so a change refreshes both.
export const CATALOG_USAGE_KEY = "usage";

// What a row of the dialog shows: the entry, its edit form, or the merge picker.
export const CATALOG_ROW_MODE = { view: "view", edit: "edit", merge: "merge" } as const;
