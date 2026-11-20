import { useAuth } from "@auth/authStore";
import { readToken } from "@auth/tokenStore";
import { API_URL } from "@lib/config";
import { createApiClient } from "@pfa/shared/api/apiClient";
import { bearerAuth } from "@pfa/shared/api/auth/bearerAuth";

/**
 * The app's single API client: the shared fetchers, signed with the Bearer token from the
 * Keychain. A refused token (expired, revoked) signs the app out instead of retrying.
 */
export const api = createApiClient({
  baseUrl: API_URL,
  auth: bearerAuth({
    getToken: readToken,
    onTokenRejected: () => useAuth.getState().signOut(),
  }),
});
