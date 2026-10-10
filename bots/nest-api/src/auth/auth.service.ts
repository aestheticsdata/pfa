import { randomUUID } from "node:crypto";
import { ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { AuditService } from "#app/audit/audit.service.js";
import { RECOVERY_RATE_LIMIT, SIGNIN_RATE_LIMIT } from "#app/config/field-limits.js";
import { AUTH_ERROR } from "#app/contracts/authErrors.js";
import { PrismaService } from "#app/prisma/prisma.service.js";
import { RedisService } from "#app/redis/redis.service.js";
import { AuditStatus } from "#prisma-client/enums.js";

import type { AuditActor } from "#app/audit/interfaces/auditTypes.js";
import type { RecoverBody, SessionUser, SetupBody, SignInBody } from "#app/auth/interfaces/authTypes.js";

/** Twelve rounds, as Zeus: the operator signs in rarely, a guesser pays every time. */
const BCRYPT_ROUNDS = 12;
/** Hashed when the account is unknown, so a missing account costs the same time as a wrong password. */
const DUMMY_HASH = "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

const normaliseEmail = (email: string): string => email.trim().toLowerCase();

/**
 * One sealed account, Zeus's model (PFA-127): `/setup` works once, sign-in is rate limited per
 * address, recovery per email, and every attempt leaves an audit row — except a flood, which leaves
 * one row per window rather than writing itself into the log.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  async accountExists(): Promise<boolean> {
    return (await this.prisma.user.count()) > 0;
  }

  async findById(id: string): Promise<SessionUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    return user ?? null;
  }

  async signIn(body: SignInBody, from: AuditActor): Promise<SessionUser> {
    const email = normaliseEmail(body.email);
    const key = `signin:${from.ip ?? "unknown"}`;
    const hit = await this.redis.hitRateLimit(key, SIGNIN_RATE_LIMIT.maxAttempts, SIGNIN_RATE_LIMIT.windowSeconds);
    if (hit.limited) {
      if (hit.count === SIGNIN_RATE_LIMIT.maxAttempts + 1) {
        await this.audit.record({
          actor: { ...from, email },
          action: "auth.signin",
          status: AuditStatus.failed,
          detail: "rate limited",
        });
      }
      throw tooManyAttempts(hit.retryAfterSec);
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    const matches = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches) {
      // No row for an unknown address: guessing at addresses must not grow the log.
      if (user) {
        await this.audit.record({
          actor: { ...from, email },
          action: "auth.signin",
          status: AuditStatus.failed,
          detail: "wrong password",
        });
      }
      throw new UnauthorizedException("Invalid credentials", { errorCode: AUTH_ERROR.invalidCredentials });
    }

    // Someone who fumbled nine times then got it right must not be one mistake from a lockout.
    await this.redis.clearRateLimit(key);
    await this.audit.record({ actor: { ...from, email }, action: "auth.signin", status: AuditStatus.ok });
    return { id: user.id, email: user.email };
  }

  /** First run only; the `singleton` column refuses a second account even in a race. */
  async setup(body: SetupBody, from: AuditActor): Promise<SessionUser> {
    if (await this.accountExists()) {
      throw new ConflictException("Already set up", { errorCode: AUTH_ERROR.sealed });
    }
    const email = normaliseEmail(body.email);
    const [passwordHash, recoveryPassphraseHash] = await Promise.all([
      bcrypt.hash(body.password, BCRYPT_ROUNDS),
      bcrypt.hash(body.recoveryPassphrase.trim(), BCRYPT_ROUNDS),
    ]);
    try {
      const user = await this.prisma.user.create({
        data: { id: randomUUID(), email, passwordHash, recoveryPassphraseHash },
      });
      await this.audit.record({ actor: { ...from, email }, action: "auth.setup", status: AuditStatus.ok });
      return { id: user.id, email: user.email };
    } catch {
      throw new ConflictException("Already set up", { errorCode: AUTH_ERROR.sealed });
    }
  }

  /**
   * Spends the recovery passphrase to set a new password. Every failure answers the same — wrong
   * passphrase or unknown address — except the rate limit, which must be told apart. A success
   * ends every live session: a reset that leaves the intruder's session alive is cosmetic.
   */
  async recover(body: RecoverBody, from: AuditActor): Promise<void> {
    const email = normaliseEmail(body.email);
    const key = `recover:${email}`;
    const hit = await this.redis.hitRateLimit(key, RECOVERY_RATE_LIMIT.maxAttempts, RECOVERY_RATE_LIMIT.windowSeconds);
    if (hit.limited) {
      await this.audit.record({
        actor: { ...from, email },
        action: "auth.recover",
        status: AuditStatus.failed,
        detail: "rate limited",
      });
      throw tooManyAttempts(hit.retryAfterSec);
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    const matches = await bcrypt.compare(body.recoveryPassphrase.trim(), user?.recoveryPassphraseHash ?? DUMMY_HASH);
    if (!user || !matches) {
      await this.audit.record({
        actor: { ...from, email },
        action: "auth.recover",
        status: AuditStatus.failed,
        detail: "wrong passphrase or unknown account",
      });
      throw new UnauthorizedException("Email or recovery passphrase is incorrect", {
        errorCode: AUTH_ERROR.recoveryFailed,
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS) },
    });
    await this.redis.clearAllSessions();
    await this.redis.clearRateLimit(key);
    await this.audit.record({ actor: { ...from, email }, action: "auth.recover", status: AuditStatus.ok });
  }

  async signOut(from: AuditActor): Promise<void> {
    await this.audit.record({ actor: from, action: "auth.signout", status: AuditStatus.ok });
  }
}

function tooManyAttempts(retryAfterSec: number): HttpException {
  return new HttpException(
    { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: "Too many attempts", retryAfterSec },
    HttpStatus.TOO_MANY_REQUESTS,
    { errorCode: AUTH_ERROR.rateLimited },
  );
}
