import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createApiClient } from "#api/apiClient";
import { ApiError } from "#api/apiError";
import { bearerAuth } from "#api/auth/bearerAuth";
import { cookieSessionAuth } from "#api/auth/cookieSessionAuth";
import { fetchSpendings } from "#api/fetchers/spendings";
import { HTTP_METHOD } from "#api/httpMethod";

import type { AuthStrategy } from "#api/interfaces/httpTypes";

const BASE_URL = "https://pfa.test/api";

/** A fake `fetch` answering each call with the next queued status + body, and recording the calls. */
const fakeFetch = (...answers: Array<[number, unknown]>) => {
  const queue = [...answers];
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    const [status, body] = queue.shift() ?? [500, ""];
    return new Response(body === "" ? "" : JSON.stringify(body), { status });
  });
};

const noAuth: AuthStrategy = { credentials: "omit", authorize: async () => ({}), recover: async () => false };

const callOf = (mock: ReturnType<typeof fakeFetch>, index: number) => {
  const [url, init] = mock.mock.calls[index] ?? [];
  return { url: String(url), init: init ?? {}, headers: new Headers(init?.headers) };
};

describe("createApiClient", () => {
  it("builds the URL from the base, the path and the non-empty query values", async () => {
    const fetch = fakeFetch([200, []]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: noAuth, fetch });

    await api.get("/spendings/search", z.array(z.unknown()), { q: "bakery café", year: null, cursor: undefined });

    expect(callOf(fetch, 0).url).toBe(`${BASE_URL}/spendings/search?q=bakery+caf%C3%A9`);
  });

  it("sends a JSON body with its content type", async () => {
    const fetch = fakeFetch([201, { ID: "s1" }]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: noAuth, fetch });

    const created = await api.send("/spendings", {
      method: HTTP_METHOD.post,
      data: { label: "Bakery" },
      schema: z.object({ ID: z.string() }),
    });

    const { init, headers } = callOf(fetch, 0);
    expect(created).toEqual({ ID: "s1" });
    expect(init.body).toBe(JSON.stringify({ label: "Bakery" }));
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("rejects a non-2xx answer with an ApiError carrying status and body", async () => {
    const fetch = fakeFetch([400, { message: "label too long" }]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: noAuth, fetch });

    const failure = await api.request("/spendings").catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).response).toEqual({ status: 400, data: { message: "label too long" } });
  });

  it("reports a contract drift through onDrift before failing", async () => {
    const onDrift = vi.fn();
    const fetch = fakeFetch([200, [{ ID: 42 }]]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: noAuth, fetch, onDrift });

    await expect(fetchSpendings(api, { from: "2026-11-01", to: "2026-11-30" })).rejects.toThrow();
    expect(onDrift).toHaveBeenCalledOnce();
    expect(onDrift.mock.calls[0]?.[0].api_contract.endpoint).toBe("/spendings");
  });
});

describe("bearerAuth", () => {
  it("signs every request with the stored token and sends no cookie", async () => {
    const fetch = fakeFetch([200, ""]);
    const auth = bearerAuth({ getToken: async () => "tok-123", onTokenRejected: async () => {} });
    const api = createApiClient({ baseUrl: BASE_URL, auth, fetch });

    await api.request("/categories");

    const { init, headers } = callOf(fetch, 0);
    expect(headers.get("Authorization")).toBe("Bearer tok-123");
    expect(init.credentials).toBe("omit");
  });

  it("hands back to sign-in on a 401 and never retries", async () => {
    const onTokenRejected = vi.fn(async () => {});
    const fetch = fakeFetch([401, ""]);
    const api = createApiClient({
      baseUrl: BASE_URL,
      auth: bearerAuth({ getToken: async () => "expired", onTokenRejected }),
      fetch,
    });

    await expect(api.request("/categories")).rejects.toBeInstanceOf(ApiError);
    expect(onTokenRejected).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("cookieSessionAuth", () => {
  const hooksWith = (token: string | null) => {
    let current = token;
    return {
      getCsrfToken: () => current,
      setCsrfToken: vi.fn((next: string) => {
        current = next;
      }),
      onSessionLost: vi.fn(),
    };
  };

  it("adds the CSRF token to writes only, and sends the session cookie", async () => {
    const fetch = fakeFetch([200, ""], [200, ""]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: cookieSessionAuth(hooksWith("csrf-1")), fetch });

    await api.request("/categories");
    await api.request("/categories/c1", { method: HTTP_METHOD.delete });

    expect(callOf(fetch, 0).headers.get("x-csrf-token")).toBeNull();
    expect(callOf(fetch, 1).headers.get("x-csrf-token")).toBe("csrf-1");
    expect(callOf(fetch, 1).init.credentials).toBe("include");
  });

  it("refreshes a rotated CSRF token after a 403 on a write, then retries once", async () => {
    const hooks = hooksWith("stale");
    const fetch = fakeFetch([403, ""], [200, { csrfToken: "fresh" }], [200, ""]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: cookieSessionAuth(hooks), fetch });

    await api.request("/categories/c1", { method: HTTP_METHOD.delete });

    expect(callOf(fetch, 1).url).toBe(`${BASE_URL}/users/csrf`);
    expect(hooks.setCsrfToken).toHaveBeenCalledWith("fresh");
    expect(callOf(fetch, 2).headers.get("x-csrf-token")).toBe("fresh");
  });

  it("reports the lost session on a 401", async () => {
    const hooks = hooksWith("csrf-1");
    const fetch = fakeFetch([401, ""]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: cookieSessionAuth(hooks), fetch });

    await expect(api.request("/users/me")).rejects.toBeInstanceOf(ApiError);
    expect(hooks.onSessionLost).toHaveBeenCalledOnce();
  });

  it("does not retry a 403 on a read", async () => {
    const fetch = fakeFetch([403, ""]);
    const api = createApiClient({ baseUrl: BASE_URL, auth: cookieSessionAuth(hooksWith("csrf-1")), fetch });

    await expect(api.request("/categories")).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
