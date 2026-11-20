export const HTTP_METHOD = {
  get: "GET",
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
} as const;

const SAFE_METHODS: ReadonlySet<string> = new Set([HTTP_METHOD.get]);

/** A method that changes nothing server-side, so it needs no CSRF token. */
export const isSafeMethod = (method: string) => SAFE_METHODS.has(method);
