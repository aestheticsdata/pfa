import { isAuthorized } from "@core/control/controlAuth";
import { describe, expect, it } from "vitest";

const TOKEN = "t".repeat(40);

describe("isAuthorized", () => {
  it("accepts the exact bearer token", () => {
    expect(isAuthorized(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
  });

  it("refuses a missing, malformed or wrong token", () => {
    expect(isAuthorized(undefined, TOKEN)).toBe(false);
    expect(isAuthorized("", TOKEN)).toBe(false);
    expect(isAuthorized(TOKEN, TOKEN)).toBe(false);
    expect(isAuthorized(`Basic ${TOKEN}`, TOKEN)).toBe(false);
    expect(isAuthorized(`Bearer ${TOKEN}x`, TOKEN)).toBe(false);
    expect(isAuthorized("Bearer ", TOKEN)).toBe(false);
  });

  it("refuses everything when no token is configured", () => {
    expect(isAuthorized("Bearer ", "")).toBe(false);
  });
});
