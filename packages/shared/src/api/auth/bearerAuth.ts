import type { BearerTokenHooks } from "#api/auth/interfaces/authStrategyTypes";
import type { AuthStrategy } from "#api/interfaces/httpTypes";

/**
 * The mobile app's sign-in (PFA-286): an opaque token from `POST /auth/token`, kept in the
 * device's secure store and sent as `Authorization: Bearer`. No cookie, so no CSRF. A 401 or 403
 * means the token expired or was revoked: hand back to the sign-in screen, never retry.
 */
export const bearerAuth = (hooks: BearerTokenHooks): AuthStrategy => ({
  credentials: "omit",

  authorize: async (): Promise<Record<string, string>> => {
    const token = await hooks.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  recover: async () => {
    await hooks.onTokenRejected();
    return false;
  },
});
