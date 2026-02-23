import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { UsersService } from "@users/users.service";
import { SignInDto } from "@users/dto/sign-in.dto";
import { AddUserDto } from "@users/dto/add-user.dto";
import { RedisService } from "@redis/redis.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

import type { SignInResponse } from "@users/users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  @Get("me")
  @UseGuards(SessionAuthGuard)
  async me(@Req() req: Request): Promise<SignInResponse> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    return this.usersService.findById(userId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto, @Req() req: Request): Promise<SignInResponse> {
    const result = await this.usersService.signIn(dto.email, dto.password);
    await this.redisService.clearSessionsForUser(result.user.id);
    (req.session as { userId?: string }).userId = result.user.id;
    return result;
  }

  @Post("add")
  @HttpCode(HttpStatus.CREATED)
  async addUser(@Body() dto: AddUserDto, @Req() req: Request): Promise<SignInResponse> {
    const result = await this.usersService.addUser(dto);
    await this.redisService.clearSessionsForUser(result.user.id);
    (req.session as { userId?: string }).userId = result.user.id;
    return result;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request): Promise<{ ok: boolean }> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve({ ok: true });
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
