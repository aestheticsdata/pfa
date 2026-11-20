import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import type { AuthTokenService } from "@users/auth-token.service";
import type { Request } from "express";

type GuardedRequest = Request & { user?: { id: string } };

const contextFor = (request: Partial<Request>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;

const tokensResolving = (owner: string | null) => {
  const resolve = jest.fn((_token: string) => Promise.resolve(owner));
  return { service: { resolve } as unknown as AuthTokenService, resolve };
};

/** The web's cookie session and the mobile app's Bearer token reach the routes the same way (PFA-286). */
describe("SessionAuthGuard", () => {
  it("lets a cookie session through without looking at any token", async () => {
    const { service, resolve } = tokensResolving("someone-else");
    const request = {
      session: { userId: "web-user" },
      headers: { authorization: "Bearer t" },
    } as unknown as GuardedRequest;

    await expect(new SessionAuthGuard(service).canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: "web-user" });
    expect(resolve).not.toHaveBeenCalled();
  });

  it("lets a valid Bearer token through as its user", async () => {
    const { service, resolve } = tokensResolving("mobile-user");
    const request = { headers: { authorization: "Bearer abc123" } } as unknown as GuardedRequest;

    await expect(new SessionAuthGuard(service).canActivate(contextFor(request))).resolves.toBe(true);
    expect(resolve).toHaveBeenCalledWith("abc123");
    expect(request.user).toEqual({ id: "mobile-user" });
  });

  it("refuses an unknown, expired or revoked token", async () => {
    const { service } = tokensResolving(null);
    const request = { headers: { authorization: "Bearer gone" } } as unknown as GuardedRequest;

    await expect(new SessionAuthGuard(service).canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("refuses a request with neither a session nor a token", async () => {
    const { service } = tokensResolving("unused");
    const request = { session: {}, headers: {} } as unknown as GuardedRequest;

    await expect(new SessionAuthGuard(service).canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
