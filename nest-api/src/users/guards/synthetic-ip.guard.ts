import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { isSyntheticEmail } from "@users/synthetic-email.util";
import { isSyntheticIpAllowed } from "@users/synthetic-ip.util";

interface SyntheticSession {
  userId?: string;
  isSynthetic?: boolean;
}

/**
 * Global guard (PFA-122): a synthetic account is only ever used from the bot runner's host. Any
 * request touching one from another address — signing up or in with a `@synthetic.test` email,
 * or riding a bot's session cookie — is refused, the session is destroyed, and an alert line is
 * logged for the bot back-office to raise (PFA-127).
 *
 * Runs before route guards and before validation, so it reads the raw body: an email that is not
 * a string is simply not synthetic, and validation rejects it afterwards as usual.
 *
 * `req.ip` is the address nginx saw (`trust proxy` = 1 in main.ts), never a client-forged header.
 */
@Injectable()
export class SyntheticIpGuard implements CanActivate {
  constructor(@InjectPinoLogger(SyntheticIpGuard.name) private readonly logger: PinoLogger) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const session = req.session as SyntheticSession | undefined;
    const body = req.body as { email?: unknown } | undefined;
    const email = typeof body?.email === "string" ? body.email : undefined;

    const touchesSynthetic = session?.isSynthetic === true || (email !== undefined && isSyntheticEmail(email));
    if (!touchesSynthetic || isSyntheticIpAllowed(req.ip, process.env.SYNTHETIC_ALLOWED_IPS)) {
      return true;
    }

    this.logger.warn(
      {
        "event.kind": "alert",
        "event.category": "intrusion_detection",
        "event.action": "synthetic-foreign-ip",
        "event.outcome": "failure",
        "user.name": email,
        "user.id": session?.userId,
        "client.ip": req.ip,
        "url.path": req.originalUrl,
        "user_agent.original": req.headers["user-agent"],
      },
      "synthetic account used from a foreign address",
    );

    if (session?.userId) {
      await new Promise<void>((resolve) => req.session.destroy(() => resolve()));
    }
    throw new ForbiddenException();
  }
}
