import { AuthResponseSchema } from "@src/schemas/auth";
import { cookies, headers } from "next/headers";

import type { AuthResponse } from "@auth/interfaces/authTypes";

/**
 * The client-identity headers nginx sets on the page request, passed on to the API as they came
 * (PFA-252). nginx gives `/` and `/api/` the same `X-Forwarded-*`, so with them the API resolves
 * `req.ip` (`trust proxy` = 1) and `req.secure` exactly as for a browser call: the bots' IP
 * allowlist (`SyntheticIpGuard`) and the auth logs see the real client, not the loopback.
 */
const FORWARDED_HEADERS = ["x-forwarded-for", "x-forwarded-proto"];

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const getApiBaseUrlFromHeaders = (requestHeaders: Headers): string => {
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    throw new Error("Unable to build API base URL: host header is missing.");
  }

  return `${protocol}://${host}`;
};

// The laptop's API origin wins whenever it is set, in a production build too (PFA-180): a
// `next build` + `next start` on the machine — the demo film — has no nginx in front of it to
// answer `/api` on its own host. Undefined in every real deploy, where `.env.local` never
// travels.
//
// On ks-b, `API_INTERNAL_URL` (ecosystem.config.cjs) points at the API on the loopback (PFA-252),
// so the session check no longer goes back out through the public host, nginx and TLS to reach a
// process on the same machine. The header-derived public URL is only the fallback.
const getApiBaseUrlForServer = (requestHeaders: Headers): string => {
  const localOverride = process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST;
  if (localOverride) {
    return trimTrailingSlash(localOverride);
  }

  const internalUrl = process.env.API_INTERNAL_URL;
  if (internalUrl) {
    return trimTrailingSlash(internalUrl);
  }

  return getApiBaseUrlFromHeaders(requestHeaders);
};

const getForwardedHeaders = (requestHeaders: Headers): Record<string, string> =>
  Object.fromEntries(
    FORWARDED_HEADERS.flatMap((name) => {
      const value = requestHeaders.get(name);
      return value ? [[name, value]] : [];
    }),
  );

export const getServerSession = async (): Promise<AuthResponse | null> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return null;
  }

  const requestHeaders = await headers();
  const apiBaseUrl = getApiBaseUrlForServer(requestHeaders);
  const response = await fetch(`${apiBaseUrl}/api/users/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...getForwardedHeaders(requestHeaders),
      cookie: cookieHeader,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`users/me failed with status ${response.status}`);
  }

  return AuthResponseSchema.parse(await response.json());
};
