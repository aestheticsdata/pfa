import { parseAsBoolean, parseAsInteger, parseAsString } from "nuqs";

/**
 * URL-state shape for the Dashboard spending-search modal (COS-114). Keeping the
 * open flag + query + year in the URL is what lets browser Back reopen the modal
 * where the user left it. Shared by the trigger (which opens it) and the modal
 * (which reads/updates it) so both stay in sync.
 */
export const spendingSearchParsers = {
  search: parseAsBoolean.withDefault(false),
  q: parseAsString.withDefault(""),
  year: parseAsInteger,
};

// Default to replacing the entry — typing / filtering must not spam history — and
// drop each param at its default so a closed modal leaves a clean `/dashboard` URL.
// Opening overrides this with `{ history: "push" }` so Back can return to it.
export const spendingSearchUrlOptions = { history: "replace", clearOnDefault: true } as const;
