import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { UsersService } from "@users/users.service";
import { SignInDto } from "@users/dto/sign-in.dto";
import { AddUserDto } from "@users/dto/add-user.dto";

import type { SignInResponse } from "@users/users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto): Promise<SignInResponse> {
    return this.usersService.signIn(dto.email, dto.password);
  }

  @Post("add")
  @HttpCode(HttpStatus.CREATED)
  addUser(@Body() dto: AddUserDto): Promise<SignInResponse> {
    const result: Promise<SignInResponse> = this.usersService.addUser(dto);
    return result;
  }
}
