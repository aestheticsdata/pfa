import { Body, Controller, Post } from "@nestjs/common";
import { UsersService } from "@users/users.service";
import { SignInDto } from "@users/dto/sign-in.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async signIn(@Body() dto: SignInDto) {
    return this.usersService.signIn(dto.email, dto.password);
  }
}
