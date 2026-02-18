import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { AppConfig } from "@config/app.config";

export interface JwtPayload {
  id: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Auth token is not supplied");
    }

    const token = authHeader.slice(7);

    try {
      const { jwtSecret } = this.config.getOrThrow<AppConfig>("app");
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      (request as Request & { user: JwtPayload }).user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException("Token is not valid");
    }
  }
}
