/** One call to the back-office API, from the Next server. */
export interface ApiCall {
  path: string;
  method?: string;
  body?: unknown;
  /** Unsafe verbs on a signed-in session send the session's CSRF token. */
  csrf?: boolean;
}

/** What a server action reports back to its form. */
export interface ActionResult {
  ok: boolean;
  /** For the toast, or the inline error. */
  message?: string;
  errorCode?: string;
  retryAfterSec?: number;
  /** Per-field validation errors, keyed by field name. */
  fields?: Record<string, string>;
}
