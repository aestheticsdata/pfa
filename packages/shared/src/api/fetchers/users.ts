import { HTTP_METHOD } from "#api/httpMethod";
import { AuthResponseSchema, RevokeTokenResponseSchema, TokenSignInResponseSchema } from "#schemas/auth";

import type { Credentials } from "#api/fetchers/interfaces/payloadTypes";
import type { ApiClient } from "#api/interfaces/httpTypes";

/** The signed-in user, and — with a cookie session — its CSRF token. */
export const fetchMe = (api: ApiClient) => api.get("/users/me", AuthResponseSchema);

/** The mobile app's sign-in (PFA-286): the same credentials as the web, answered with a Bearer token. */
export const signInForToken = (api: ApiClient, credentials: Credentials) =>
  api.send("/users/token", { method: HTTP_METHOD.post, data: credentials, schema: TokenSignInResponseSchema });

/** Signs the mobile app out server-side: the token sent with the request is forgotten. */
export const revokeToken = (api: ApiClient) =>
  api.send("/users/token/revoke", { method: HTTP_METHOD.post, schema: RevokeTokenResponseSchema });
