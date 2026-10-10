import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { UsersController } from "@users/users.controller";
import { UsersService } from "@users/users.service";
import { SyntheticIpGuard } from "@users/guards/synthetic-ip.guard";

@Module({
  imports: [],
  controllers: [UsersController],
  // Global: a bot session must be refused on every route, not only the ones under /users.
  providers: [UsersService, { provide: APP_GUARD, useClass: SyntheticIpGuard }],
})
export class UsersModule {}
