import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { hasAuthenticatedSession, hasValidCsrfToken, isSafeHttpMethod } from "#app/auth/csrf-token.util.js";
import { AUTH_ERROR } from "#app/contracts/authErrors.js";

import type { Request } from "express";

/** Unsafe verbs on a signed-in session must carry the session's token in `x-csrf-token`. */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (isSafeHttpMethod(request.method) || !hasAuthenticatedSession(request)) {
      return true;
    }
    if (!hasValidCsrfToken(request)) {
      throw new ForbiddenException("Invalid CSRF token", { errorCode: AUTH_ERROR.csrf });
    }
    return true;
  }
}
