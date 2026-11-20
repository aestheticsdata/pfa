import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthTokenService } from "@users/auth-token.service";
import { readBearerToken } from "@users/bearer-token.util";
import { Request } from "express";

export interface SessionUser {
  id: string;
}

/**
 * Who is calling: the web's cookie session, or — for the mobile app (PFA-286) — an
 * `Authorization: Bearer` token. The session is read first and decides alone when present, so the
 * web's flow is exactly what it was. Either way the route sees the same `request.user`.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authTokens: AuthTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request.session as { userId?: string } | undefined)?.userId ?? (await this.tokenUser(request));

    if (!userId) {
      throw new UnauthorizedException("Session required");
    }

    (request as Request & { user: SessionUser }).user = { id: userId };
    return true;
  }

  private async tokenUser(request: Request): Promise<string | null> {
    const token = readBearerToken(request);
    return token ? this.authTokens.resolve(token) : null;
  }
}
