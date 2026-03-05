import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { UsersService } from "@users/users.service";
import { SignInDto } from "@users/dto/sign-in.dto";
import { AddUserDto } from "@users/dto/add-user.dto";
import { RedisService } from "@redis/redis.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { CsrfGuard } from "@users/guards/csrf.guard";
import { clearCsrfToken, getOrCreateCsrfToken, rotateCsrfToken } from "@users/csrf-token.util";

import type { SignInResponse } from "@users/users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

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

  @Get("csrf")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  csrf(@Req() req: Request): { csrfToken: string } {
    return { csrfToken: getOrCreateCsrfToken(req) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto, @Req() req: Request): Promise<SignInResponse & { csrfToken: string }> {
    const result = await this.usersService.signIn(dto.email, dto.password);
    await this.redisService.clearSessionsForUser(result.user.id);
    (req.session as { userId?: string }).userId = result.user.id;

    return {
      ...result,
      csrfToken: rotateCsrfToken(req),
    };
  }

  @Post("add")
  @HttpCode(HttpStatus.CREATED)
  async addUser(@Body() dto: AddUserDto, @Req() req: Request): Promise<SignInResponse & { csrfToken: string }> {
    const result = await this.usersService.addUser(dto);
    await this.redisService.clearSessionsForUser(result.user.id);
    (req.session as { userId?: string }).userId = result.user.id;

    return {
      ...result,
      csrfToken: rotateCsrfToken(req),
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: boolean }> {
    clearCsrfToken(req);
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
