import { AuthResponseSchema } from "#schemas/auth";

import type { ApiClient } from "#api/interfaces/httpTypes";

/** The signed-in user, and — with a cookie session — its CSRF token. */
export const fetchMe = (api: ApiClient) => api.get("/users/me", AuthResponseSchema);
