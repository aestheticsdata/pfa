import { env } from "@config/env";
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { isSyntheticEmail } from "@users/synthetic-email.util";
import { isSyntheticIpAllowed } from "@users/synthetic-ip.util";
import type { Request } from "express";

@Injectable()
export class SignupGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (env.signupsEnabled) {
      return true;
    }

    // Closed sign-ups still let the bot runner in (PFA-122): a `@synthetic.test` email from an
    // allowlisted address, and nothing else.
    const req = context.switchToHttp().getRequest<Request>();
    const email = (req.body as { email?: unknown } | undefined)?.email;
    if (typeof email === "string" && isSyntheticEmail(email) && isSyntheticIpAllowed(req.ip, env.syntheticAllowedIps)) {
      return true;
    }

    throw new ForbiddenException("Sign-ups are currently disabled");
  }
}
