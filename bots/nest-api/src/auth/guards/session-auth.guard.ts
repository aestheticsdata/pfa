import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AUTH_ERROR } from "#app/contracts/authErrors.js";

import type { Request } from "express";
import type { BotsSession, SessionUser } from "#app/auth/interfaces/authTypes.js";

/**
 * Every route except the auth screens' sits behind this: even the list of apps is operational
 * information, never shown before sign-in (PFA-127).
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: SessionUser }>();
    const session = request.session as BotsSession | undefined;
    if (!session?.userId) {
      throw new UnauthorizedException("Session required", { errorCode: AUTH_ERROR.sessionRequired });
    }
    request.user = { id: session.userId, email: session.email ?? "unknown" };
    return true;
  }
}
