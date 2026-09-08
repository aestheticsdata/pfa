import { AuthResponseSchema } from "@src/schemas/auth";
import { cookies, headers } from "next/headers";

import type { AuthResponse } from "@auth/interfaces/authTypes";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const getApiBaseUrlFromHeaders = async (): Promise<string> => {
  const requestHeaders = await headers();
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
// travels, so ks-b keeps deriving the base from the request headers.
const getApiBaseUrlForServer = async (): Promise<string> => {
  const localOverride = process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST;
  if (localOverride) {
    return trimTrailingSlash(localOverride);
  }

  return getApiBaseUrlFromHeaders();
};

export const getServerSession = async (): Promise<AuthResponse | null> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return null;
  }

  const apiBaseUrl = await getApiBaseUrlForServer();
  const response = await fetch(`${apiBaseUrl}/api/users/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
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
