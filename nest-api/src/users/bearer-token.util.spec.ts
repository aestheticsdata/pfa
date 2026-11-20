import { readBearerToken } from "@users/bearer-token.util";
import type { Request } from "express";

const withAuthorization = (authorization?: string) => ({ headers: { authorization } }) as unknown as Request;

describe("readBearerToken", () => {
  it("reads the token of a Bearer header, whatever the scheme's case", () => {
    expect(readBearerToken(withAuthorization("Bearer abc-123_x"))).toBe("abc-123_x");
    expect(readBearerToken(withAuthorization("bearer abc"))).toBe("abc");
  });

  it("returns null without a header, with another scheme or an empty token", () => {
    expect(readBearerToken(withAuthorization())).toBeNull();
    expect(readBearerToken(withAuthorization("Basic dXNlcjpwYXNz"))).toBeNull();
    expect(readBearerToken(withAuthorization("Bearer "))).toBeNull();
    expect(readBearerToken(withAuthorization("Bearer a b"))).toBeNull();
  });
});
