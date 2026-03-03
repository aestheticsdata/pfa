import { cookies, headers } from "next/headers";

import type { AuthResponse } from "@auth/types";

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

const getApiBaseUrlForServer = async (): Promise<string> => {
  const localOverride = process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST;
  if (process.env.NODE_ENV !== "production" && localOverride) {
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

  return (await response.json()) as AuthResponse;
};
