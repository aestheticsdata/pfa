import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { UsersController } from "@users/users.controller";
import { UsersService } from "@users/users.service";
import { SignInLimiterService } from "@users/sign-in-limiter.service";
import { SyntheticIpGuard } from "@users/guards/synthetic-ip.guard";
import { SyntheticAccountsController } from "@users/synthetic-accounts.controller";
import { SyntheticAccountsService } from "@users/synthetic-accounts.service";

@Module({
  imports: [],
  controllers: [UsersController, SyntheticAccountsController],
  // Global: a bot session must be refused on every route, not only the ones under /users.
  providers: [
    UsersService,
    SignInLimiterService,
    SyntheticAccountsService,
    { provide: APP_GUARD, useClass: SyntheticIpGuard },
  ],
})
export class UsersModule {}
