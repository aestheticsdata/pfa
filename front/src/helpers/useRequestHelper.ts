"use client";

import { useAuth } from "@auth/context/AuthContext";
import { ROUTES } from "@components/shared/config/constants";
import { isApiError, send } from "@helpers/http";

import type { ApiResponse, RequestOptions } from "@helpers/interfaces/httpTypes";

const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const normalizeUrl = (url: string): string => (url.startsWith("/") ? url : `/${url}`);

const getApiBase = (): string => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST ?? "";
  }

  return "";
};

const getRequestUrl = (url: string): string => `${getApiBase()}/api${normalizeUrl(url)}`;

const isUnsafeMethod = (method?: string): boolean => !SAFE_HTTP_METHODS.has((method ?? "GET").toUpperCase());

/**
 * Sends the user to the login screen when the backend session is gone.
 *
 * Returns `true` when it triggered the redirect — the caller should then leave its
 * promise pending so the 401 never reaches the error boundary. Returns `false` when it
 * can't / shouldn't navigate (SSR, or already on `/login`), so the caller rejects /
 * throws normally instead of hanging forever. The hard navigation (like logout)
 * discards the auth context + React Query cache and re-runs the server `(private)`
 * guard. `trailingSlash: true` means the path can be `/login/`, hence the strip.
 */
const redirectToLogin = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.location.pathname.replace(/\/$/, "") === ROUTES.login.path) {
    return false;
  }

  window.location.replace(ROUTES.login.path);
  return true;
};

const useRequestHelper = () => {
  const { user, csrfToken, setCsrfToken } = useAuth();

  const request = (url: string, options?: RequestOptions): Promise<ApiResponse> => send(getRequestUrl(url), options);

  const privateRequest = async (url: string, options: RequestOptions = {}): Promise<ApiResponse> => {
    if (!user) {
      if (redirectToLogin()) {
        return new Promise<never>(() => {});
      }
      throw new Error("User not logged in");
    }

    const method = (options.method ?? "GET").toUpperCase();
    const requestHeaders: Record<string, string> = { ...options.headers };

    if (csrfToken && isUnsafeMethod(method)) {
      requestHeaders["x-csrf-token"] = csrfToken;
    }

    const executeRequest = (headers = requestHeaders): Promise<ApiResponse> =>
      send(getRequestUrl(url), { ...options, method, headers });

    try {
      return await executeRequest();
    } catch (error: unknown) {
      const status = isApiError(error) ? error.response.status : undefined;

      if (status === 403 && isUnsafeMethod(method)) {
        try {
          const csrfResponse = await send(getRequestUrl("/users/csrf"));
          const refreshedToken = (csrfResponse.data as { csrfToken?: string } | null)?.csrfToken;
          if (refreshedToken) {
            setCsrfToken(refreshedToken);
            return await executeRequest({
              ...requestHeaders,
              "x-csrf-token": refreshedToken,
            });
          }
        } catch {
          // Fall through to the 401 / throw path below.
        }
      }

      if (status === 401 && redirectToLogin()) {
        // Expired session: navigate to /login and leave this promise pending so the
        // 401 never becomes a React Query error and never reaches error.tsx.
        return new Promise<never>(() => {});
      }

      throw error;
    }
  };

  return {
    request,
    privateRequest,
  };
};

export default useRequestHelper;
