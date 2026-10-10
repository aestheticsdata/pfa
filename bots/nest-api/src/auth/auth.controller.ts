import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { recoverSchema, setupSchema, signInSchema } from "#app/auth/auth.schemas.js";
import { AuthService } from "#app/auth/auth.service.js";
import { clearCsrfToken, getOrCreateCsrfToken, rotateCsrfToken } from "#app/auth/csrf-token.util.js";
import { CsrfGuard } from "#app/auth/guards/csrf.guard.js";
import { SessionAuthGuard } from "#app/auth/guards/session-auth.guard.js";
import { clientIp, clientUserAgent } from "#app/infrastructure/client-ip.js";
import { SESSION_COOKIE } from "#app/infrastructure/session.js";

import type { Request, Response } from "express";
import type { AuditActor } from "#app/audit/interfaces/auditTypes.js";
import type { BotsSession, RecoverBody, SessionUser, SetupBody, SignInBody } from "#app/auth/interfaces/authTypes.js";
import type { AuthState } from "#app/contracts/interfaces/authTypes.js";

const from = (req: Request, email = "unknown"): AuditActor => ({
  email,
  ip: clientIp(req),
  userAgent: clientUserAgent(req),
});

/** Promise wrappers around express-session's callback API. */
const regenerate = (req: Request): Promise<void> =>
  new Promise((resolve, reject) => req.session.regenerate((error) => (error ? reject(error) : resolve())));
const destroy = (req: Request): Promise<void> =>
  new Promise((resolve, reject) => req.session.destroy((error) => (error ? reject(error) : resolve())));

/**
 * The auth screens' API (sign in, first-run setup, recover, sign out). The only routes reachable
 * without a session; the front reaches them through its own server, never from the browser.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Which screen to show, and the CSRF token when signed in. A dead session reads as signed out. */
  @Get("state")
  async state(@Req() req: Request): Promise<AuthState> {
    const session = req.session as BotsSession;
    const user = session.userId ? await this.auth.findById(session.userId) : null;
    return {
      accountExists: await this.auth.accountExists(),
      signedIn: user !== null,
      email: user?.email ?? null,
      csrfToken: user ? getOrCreateCsrfToken(req) : null,
    };
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  async signIn(@Body({ schema: signInSchema }) body: SignInBody, @Req() req: Request): Promise<AuthState> {
    const user = await this.auth.signIn(body, from(req, body.email));
    return this.openSession(req, user);
  }

  /** First run: creates the one account and signs it in. */
  @Post("setup")
  @HttpCode(HttpStatus.CREATED)
  async setup(@Body({ schema: setupSchema }) body: SetupBody, @Req() req: Request): Promise<AuthState> {
    const user = await this.auth.setup(body, from(req, body.email));
    return this.openSession(req, user);
  }

  /** Opens no session: the front sends the operator to sign in with the new password. */
  @Post("recover")
  @HttpCode(HttpStatus.OK)
  async recover(@Body({ schema: recoverSchema }) body: RecoverBody, @Req() req: Request): Promise<{ ok: true }> {
    await this.auth.recover(body, from(req, body.email));
    return { ok: true };
  }

  /** The audit row is written before the session goes: the actor is read from it. */
  @Post("signout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    await this.auth.signOut(from(req, (req as Request & { user: SessionUser }).user.email));
    clearCsrfToken(req);
    await destroy(req);
    res.clearCookie(SESSION_COOKIE);
    return { ok: true };
  }

  /** A fresh session id at sign-in: a cookie planted before it can never end up signed in. */
  private async openSession(req: Request, user: SessionUser): Promise<AuthState> {
    await regenerate(req);
    const session = req.session as BotsSession;
    session.userId = user.id;
    session.email = user.email;
    return { accountExists: true, signedIn: true, email: user.email, csrfToken: rotateCsrfToken(req) };
  }
}
