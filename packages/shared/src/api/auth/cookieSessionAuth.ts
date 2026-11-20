import { isSafeMethod } from "#api/httpMethod";
import { CsrfTokenSchema } from "#schemas/auth";

import type { CookieSessionHooks } from "#api/auth/interfaces/authStrategyTypes";
import type { AuthFailure, AuthStrategy } from "#api/interfaces/httpTypes";

const CSRF_HEADER = "x-csrf-token";
const CSRF_ROUTE = "/users/csrf";
const HTTP_UNAUTHORIZED = 401;

/**
 * The web's sign-in: the `pfa.sid` session cookie travels on its own, and every write carries the
 * session's CSRF token. A 403 on a write usually means the token rotated: fetch a fresh one and
 * retry once. A 401 means the session is gone.
 */
export const cookieSessionAuth = (hooks: CookieSessionHooks): AuthStrategy => ({
  credentials: "include",

  authorize: async ({ method }): Promise<Record<string, string>> => {
    const token = hooks.getCsrfToken();
    return token && !isSafeMethod(method) ? { [CSRF_HEADER]: token } : {};
  },

  recover: async ({ status, request, fetchRaw }: AuthFailure) => {
    if (status === HTTP_UNAUTHORIZED) {
      hooks.onSessionLost();
      return false;
    }
    // A 403 on a read is a refusal, not a stale token: nothing to retry.
    if (isSafeMethod(request.method)) return false;

    try {
      const parsed = CsrfTokenSchema.safeParse((await fetchRaw(CSRF_ROUTE)).data);
      if (!parsed.success) return false;
      hooks.setCsrfToken(parsed.data.csrfToken);
      return true;
    } catch {
      return false;
    }
  },
});
