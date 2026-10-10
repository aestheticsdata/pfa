import { isAllowed } from "@users/guards/synthetic-admin.guard";

import type { Request } from "express";

const TOKEN = "t".repeat(40);

interface FakeRequest {
  remoteAddress?: string;
  headers?: Record<string, string>;
}

const req = ({ remoteAddress = "127.0.0.1", headers = {} }: FakeRequest): Request =>
  ({ socket: { remoteAddress }, headers: { authorization: `Bearer ${TOKEN}`, ...headers } }) as unknown as Request;

/**
 * The internal route that disables or purges a bot (PFA-127) must answer only the runner on ks-b:
 * loopback socket, no proxy header (never through nginx), and the service token.
 */
describe("SyntheticAdminGuard", () => {
  it("lets the runner in: loopback, direct, right token", () => {
    expect(isAllowed(req({}), TOKEN)).toBe(true);
    expect(isAllowed(req({ remoteAddress: "::1" }), TOKEN)).toBe(true);
  });

  it("refuses anything that came through nginx, even from loopback with the token", () => {
    expect(isAllowed(req({ headers: { "x-forwarded-for": "203.0.113.9" } }), TOKEN)).toBe(false);
    expect(isAllowed(req({ headers: { "x-real-ip": "203.0.113.9" } }), TOKEN)).toBe(false);
  });

  it("refuses another machine, a wrong token, or no token", () => {
    expect(isAllowed(req({ remoteAddress: "203.0.113.9" }), TOKEN)).toBe(false);
    expect(isAllowed(req({ headers: { authorization: "Bearer nope" } }), TOKEN)).toBe(false);
    expect(isAllowed(req({ headers: { authorization: "" } }), TOKEN)).toBe(false);
  });

  it("fails closed when the server has no token, or a short one", () => {
    expect(isAllowed(req({}), undefined)).toBe(false);
    expect(isAllowed(req({ headers: { authorization: "Bearer short" } }), "short")).toBe(false);
  });
});
