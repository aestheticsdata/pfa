import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { UsersService } from "@users/users.service";
import { SignInDto } from "@users/dto/sign-in.dto";
import { AddUserDto } from "@users/dto/add-user.dto";
import { UpdateUserDto } from "@users/dto/update-user.dto";
import { RedisService } from "@redis/redis.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { CsrfGuard } from "@users/guards/csrf.guard";
import { SignupGuard } from "@users/guards/signup.guard";
import { clearCsrfToken, getOrCreateCsrfToken, rotateCsrfToken } from "@users/csrf-token.util";

import type { SignInResponse } from "@users/users.service";

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
    let result: SignInResponse;
    try {
      result = await this.usersService.signIn(dto.email, dto.password);
    } catch (error) {
      // Logged, then rethrown untouched: the caller's response is exactly what it was before.
      this.auth({ action: "user-login", outcome: "failure", email: dto.email }, req);
      throw error;
    }

    await this.redisService.clearSessionsForUser(result.user.id);
    (req.session as { userId?: string }).userId = result.user.id;
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
    const result = await this.usersService.addUser(dto);
    await this.redisService.clearSessionsForUser(result.user.id);
    (req.session as { userId?: string }).userId = result.user.id;
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
