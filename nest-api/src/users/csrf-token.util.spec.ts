import type { Request } from "express";
import {
  clearCsrfToken,
  getOrCreateCsrfToken,
  hasAuthenticatedSession,
  hasValidCsrfToken,
  isSafeHttpMethod,
  rotateCsrfToken,
} from "./csrf-token.util";

/**
 * Unit tests for the CSRF double-submit helpers (PFA-12): the session holds the
 * token, the client echoes it in a header, and every unsafe request is refused
 * unless both match. A fake request stands in for Express.
 */
describe("csrf-token.util", () => {
  const makeRequest = (session: Record<string, unknown> | undefined, headers: Record<string, string> = {}) =>
    ({ session, header: (name: string) => headers[name] }) as unknown as Request;

  it("treats only GET, HEAD and OPTIONS as safe, case-insensitively", () => {
    expect(isSafeHttpMethod("GET")).toBe(true);
    expect(isSafeHttpMethod("head")).toBe(true);
    expect(isSafeHttpMethod("Options")).toBe(true);
    expect(isSafeHttpMethod("POST")).toBe(false);
    expect(isSafeHttpMethod("DELETE")).toBe(false);
  });

  it("sees an authenticated session only when it carries a user id", () => {
    expect(hasAuthenticatedSession(makeRequest({ userId: "user-1" }))).toBe(true);
    expect(hasAuthenticatedSession(makeRequest({}))).toBe(false);
    expect(hasAuthenticatedSession(makeRequest(undefined))).toBe(false);
  });

  it("keeps the same token across calls and replaces it on rotation", () => {
    const req = makeRequest({});
    const first = getOrCreateCsrfToken(req);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(getOrCreateCsrfToken(req)).toBe(first);

    const rotated = rotateCsrfToken(req);
    expect(rotated).not.toBe(first);
    expect(getOrCreateCsrfToken(req)).toBe(rotated);
  });

  it("forgets the token once cleared", () => {
    const session: Record<string, unknown> = {};
    const req = makeRequest(session);
    getOrCreateCsrfToken(req);
    clearCsrfToken(req);
    expect(session.csrfToken).toBeUndefined();
  });

  it("accepts the matching token from either header", () => {
    expect(hasValidCsrfToken(makeRequest({ csrfToken: "abc" }, { "x-csrf-token": "abc" }))).toBe(true);
    expect(hasValidCsrfToken(makeRequest({ csrfToken: "abc" }, { "x-xsrf-token": "abc" }))).toBe(true);
  });

  it("refuses a missing, empty, wrong or differently sized token", () => {
    expect(hasValidCsrfToken(makeRequest({}, { "x-csrf-token": "abc" }))).toBe(false);
    expect(hasValidCsrfToken(makeRequest({ csrfToken: "abc" }))).toBe(false);
    expect(hasValidCsrfToken(makeRequest({ csrfToken: "abc" }, { "x-csrf-token": "" }))).toBe(false);
    expect(hasValidCsrfToken(makeRequest({ csrfToken: "abc" }, { "x-csrf-token": "abd" }))).toBe(false);
    expect(hasValidCsrfToken(makeRequest({ csrfToken: "abc" }, { "x-csrf-token": "abcd" }))).toBe(false);
  });
});
