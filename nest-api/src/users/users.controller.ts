import { env } from "@config/env";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { RedisService } from "@redis/redis.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { clearCsrfToken, getOrCreateCsrfToken, rotateCsrfToken } from "@users/csrf-token.util";
import { AddUserDto } from "@users/dto/add-user.dto";
import { SignInDto } from "@users/dto/sign-in.dto";
import { UpdateUserDto } from "@users/dto/update-user.dto";
import { CsrfGuard } from "@users/guards/csrf.guard";
import { SignupGuard } from "@users/guards/signup.guard";
import { SignInLimiterService } from "@users/sign-in-limiter.service";
import { isSyntheticEmail } from "@users/synthetic-email.util";
import { isSyntheticIpAllowed } from "@users/synthetic-ip.util";
import type { SignInResponse } from "@users/users.service";
import { UsersService } from "@users/users.service";
import type { Request, Response } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";

/**
 * ECS's vocabulary for an authentication event, so that "show me the failed sign-ins" is one
 * filter rather than a guess at what a message happens to say (IKN-1).
 *
 * These lines repeat a little of what the access line already carries — the address in
 * particular. Deliberately: this is the line somebody searches for on its own, months later, and
 * it should answer without needing the request beside it.
 */
type AuthEvent = {
  action: "user-login" | "user-signup" | "user-logout";
  outcome: "success" | "failure";
  email?: string;
  userId?: string;
};

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly signInLimiter: SignInLimiterService,
    @InjectPinoLogger(UsersController.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * A failure is a `warn`, never an `error`: someone mistyping their password is the system
   * working as designed. `error` is for what nobody chose.
   *
   * The attempted address is recorded even when the sign-in fails, and that is the point — a run
   * of failures against a name nobody here uses is the only way that ever becomes visible. The
   * password is never touched, and `redact` would censor it if it were.
   */
  private auth(event: AuthEvent, req: Request): void {
    const line = {
      "event.category": "authentication",
      "event.action": event.action,
      "event.outcome": event.outcome,
      "user.name": event.email,
      "user.id": event.userId,
      "client.ip": req.ip,
      "user_agent.original": req.headers["user-agent"],
    };

    if (event.outcome === "failure") this.logger.warn(line, `${event.action} failed`);
    else this.logger.info(line, `${event.action} succeeded`);
  }

  /**
   * `isSynthetic` rides the session so SyntheticIpGuard can check every later request of a bot —
   * and a bot's email with it, so an alert raised from a stolen bot cookie names the bot (PFA-127).
   */
  private openSession(req: Request, result: SignInResponse): void {
    const session = req.session as { userId?: string; isSynthetic?: boolean; syntheticEmail?: string };
    session.userId = result.user.id;
    session.isSynthetic = isSyntheticEmail(result.user.email);
    if (session.isSynthetic) {
      session.syntheticEmail = result.user.email;
    }
  }

  /**
   * Refuses a sign-in or sign-up with a 429 while the address or the email has used up its
   * failures (PFA-260). The bot runner's address is exempt: its daily run must never trip it.
   */
  private async assertNotLocked(req: Request, email: string): Promise<boolean> {
    if (isSyntheticIpAllowed(req.ip, env.syntheticAllowedIps)) {
      return false;
    }
    const retryAfter = await this.signInLimiter.retryAfter(req.ip, email);
    if (retryAfter !== null) {
      req.res?.setHeader("Retry-After", String(retryAfter));
      throw new HttpException("Too many attempts, try again later", HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  async me(@Req() req: Request): Promise<SignInResponse & { csrfToken: string }> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    const response = await this.usersService.findById(userId);
    return {
      ...response,
      csrfToken: getOrCreateCsrfToken(req),
    };
  }

  @Patch("me")
  @UseGuards(SessionAuthGuard, CsrfGuard)
  @HttpCode(HttpStatus.OK)
  async updateMe(@Body() dto: UpdateUserDto, @Req() req: Request): Promise<SignInResponse> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    return this.usersService.updateUser(userId, dto);
  }

  @Get("csrf")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  csrf(@Req() req: Request): { csrfToken: string } {
    return { csrfToken: getOrCreateCsrfToken(req) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto, @Req() req: Request): Promise<SignInResponse & { csrfToken: string }> {
    const isLimited = await this.assertNotLocked(req, dto.email);
    let result: SignInResponse;
    try {
      result = await this.usersService.signIn(dto.email, dto.password);
    } catch (error) {
      // Logged, then rethrown untouched: the caller's response is exactly what it was before.
      this.auth({ action: "user-login", outcome: "failure", email: dto.email }, req);
      if (isLimited) {
        await this.signInLimiter.recordAttempt(req.ip, dto.email);
      }
      throw error;
    }
    if (isLimited) {
      await this.signInLimiter.clear(req.ip, dto.email);
    }

    this.openSession(req, result);
    await this.redisService.trackSession(result.user.id, req.sessionID);
    this.auth({ action: "user-login", outcome: "success", email: dto.email, userId: result.user.id }, req);

    return {
      ...result,
      csrfToken: rotateCsrfToken(req),
    };
  }

  @Post("add")
  @UseGuards(SignupGuard)
  @HttpCode(HttpStatus.CREATED)
  async addUser(@Body() dto: AddUserDto, @Req() req: Request): Promise<SignInResponse & { csrfToken: string }> {
    // Every sign-up counts, a created account included: nobody needs ten in a quarter of an hour.
    if (await this.assertNotLocked(req, dto.email)) {
      await this.signInLimiter.recordAttempt(req.ip, dto.email);
    }
    const result = await this.usersService.addUser(dto);
    this.openSession(req, result);
    await this.redisService.trackSession(result.user.id, req.sessionID);
    // An account being created on a single-user instance is the one event worth never missing.
    this.auth({ action: "user-signup", outcome: "success", email: dto.email, userId: result.user.id }, req);

    return {
      ...result,
      csrfToken: rotateCsrfToken(req),
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: boolean }> {
    // Read before `destroy` wipes it, so the line says who left rather than that somebody did.
    const userId = (req.session as { userId?: string }).userId;
    clearCsrfToken(req);
    this.auth({ action: "user-logout", outcome: "success", userId }, req);
    // Only this device's session goes; the user's other devices stay signed in (PFA-256).
    if (userId) {
      await this.redisService.untrackSession(userId, req.sessionID);
    }

    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else {
          res.clearCookie("pfa.sid");
          resolve({ ok: true });
        }
      });
    });
  }

  @Post("resetpassword")
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  resetPassword(): { error: string } {
    return {
      error: "Cette fonctionnalité est temporairement désactivée.",
    };
  }
}
