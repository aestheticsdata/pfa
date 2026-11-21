import { AccountsService } from "@contexts/identity/application/accounts.service";
import { SignInFlowService } from "@contexts/identity/application/sign-in-flow.service";
import { SyntheticAccountsService } from "@contexts/identity/application/synthetic-accounts.service";
import { AccountRepository } from "@contexts/identity/domain/ports/account.repository";
import { AccountPurger } from "@contexts/identity/domain/ports/account-purger";
import { PasswordHasher } from "@contexts/identity/domain/ports/password-hasher";
import { SessionRegistry } from "@contexts/identity/domain/ports/session-registry";
import { SignInThrottle } from "@contexts/identity/domain/ports/sign-in-throttle";
import {
  BcryptPasswordHasher,
  PrismaAccountPurger,
  RedisSessionRegistry,
} from "@contexts/identity/infrastructure/identity-adapters";
import { PrismaAccountRepository } from "@contexts/identity/infrastructure/prisma-account.repository";
import { RedisSignInThrottle } from "@contexts/identity/infrastructure/redis-sign-in-throttle";
import { SyntheticIpGuard } from "@contexts/identity/interface/guards/synthetic-ip.guard";
import { SyntheticAccountsController } from "@contexts/identity/interface/synthetic-accounts.controller";
import { UsersController } from "@contexts/identity/interface/users.controller";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

/**
 * The identity and access context (PFA-279): accounts, sign-in, sessions, the bot accounts. A
 * generic subdomain, kept thin; every other context learns of a user only its ID (`GetUserId`).
 */
@Module({
  controllers: [UsersController, SyntheticAccountsController],
  providers: [
    AccountsService,
    SyntheticAccountsService,
    SignInFlowService,
    { provide: AccountRepository, useClass: PrismaAccountRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: SessionRegistry, useClass: RedisSessionRegistry },
    { provide: SignInThrottle, useClass: RedisSignInThrottle },
    { provide: AccountPurger, useClass: PrismaAccountPurger },
    // Global: a bot session must be refused on every route, not only the ones under /users.
    { provide: APP_GUARD, useClass: SyntheticIpGuard },
  ],
})
export class IdentityModule {}
