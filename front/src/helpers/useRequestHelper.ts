"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@auth/context/AuthContext";
import { ROUTES } from "@components/shared/config/constants";

import type { AxiosRequestConfig, AxiosResponse } from "axios";

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

const useRequestHelper = () => {
  const router = useRouter();
  const { user, csrfToken, setCsrfToken, clearAuth } = useAuth();

  const request = (url: string, options?: AxiosRequestConfig): Promise<AxiosResponse> => {
    return axios(getRequestUrl(url), {
      withCredentials: true,
      ...options,
    });
  };

  const privateRequest = async (
    url: string,
    options?: AxiosRequestConfig,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse> => {
    if (!user) {
      clearAuth();
      router.replace(ROUTES.login.path);
      throw new Error("User not logged in");
    }

    const method = options?.method ?? "GET";
    const normalizedMethod = method.toUpperCase();
    const requestHeaders = {
      ...(options?.headers ?? {}),
    };

    if (csrfToken && isUnsafeMethod(normalizedMethod)) {
      requestHeaders["x-csrf-token"] = csrfToken;
    }

    const axiosInstance = axios.create({
      withCredentials: true,
      ...config,
    });

    const executeRequest = (headers = requestHeaders): Promise<AxiosResponse> =>
      axiosInstance(getRequestUrl(url), {
        ...options,
        method,
        headers,
      });

    try {
      return await executeRequest();
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;

      if (status === 403 && isUnsafeMethod(normalizedMethod)) {
        try {
          const csrfResponse = await axiosInstance(getRequestUrl("/users/csrf"), {
            method: "GET",
          });
          const refreshedToken = (csrfResponse.data as { csrfToken?: string })?.csrfToken;
          if (refreshedToken) {
            setCsrfToken(refreshedToken);
            return await executeRequest({
              ...requestHeaders,
              "x-csrf-token": refreshedToken,
            });
          }
        } catch {
          // Fall through to 401/throw path.
        }
      }

      if (status === 401) {
        clearAuth();
        router.replace(ROUTES.login.path);
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
