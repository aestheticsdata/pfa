import "server-only";

import { apiGet } from "@lib/api/server";

import type { AuthState } from "@contracts/interfaces/authTypes";

/** Who is signed in, as the API sees the browser's cookie. */
export function readAuthState(): Promise<AuthState> {
  return apiGet<AuthState>("/auth/state");
}
