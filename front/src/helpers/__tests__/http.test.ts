import { isApiError, parseBody, send } from "@helpers/http";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiError } from "@helpers/http";

const respond = (status: number, body: string) =>
  vi.fn().mockResolvedValue(new Response(body === "" ? null : body, { status }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseBody", () => {
  it("parses JSON, keeps other text, maps an empty body to an empty string", () => {
    expect(parseBody('{"a":1}')).toEqual({ a: 1 });
    expect(parseBody("null")).toBeNull();
    expect(parseBody("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
    expect(parseBody("")).toBe("");
  });
});

describe("send", () => {
  it("sends a plain object as JSON with the session cookie", async () => {
    const fetchMock = respond(200, '{"ok":true}');
    vi.stubGlobal("fetch", fetchMock);

    const response = await send("/api/x", { method: "POST", data: { a: 1 }, headers: { "x-csrf-token": "t" } });

    expect(response).toEqual({ status: 200, data: { ok: true } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      body: '{"a":1}',
      headers: { "Content-Type": "application/json", "x-csrf-token": "t" },
    });
  });

  it("sends FormData untouched, without a Content-Type", async () => {
    const fetchMock = respond(200, "");
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();

    await send("/api/upload", { method: "POST", data: form });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers).toEqual({});
  });

  it("defaults to a body-less GET", async () => {
    const fetchMock = respond(200, "[]");
    vi.stubGlobal("fetch", fetchMock);

    await send("/api/list");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET", body: undefined });
  });

  it("rejects a non-2xx answer with an ApiError carrying status and body", async () => {
    vi.stubGlobal("fetch", respond(409, '{"message":"conflict"}'));

    const error = await send("/api/x", { method: "PUT", data: {} }).catch((e: unknown) => e);

    expect(isApiError(error)).toBe(true);
    expect((error as ApiError).response).toEqual({ status: 409, data: { message: "conflict" } });
  });
});
