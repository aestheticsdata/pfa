import { AccountsService } from "@contexts/identity/application/accounts.service";
import { SyntheticAccountsService } from "@contexts/identity/application/synthetic-accounts.service";
import { AccountRepository } from "@contexts/identity/domain/ports/account.repository";
import { AccountPurger } from "@contexts/identity/domain/ports/account-purger";
import { PasswordHasher } from "@contexts/identity/domain/ports/password-hasher";
import { SessionRevoker } from "@contexts/identity/domain/ports/session-revoker";
import {
  BcryptPasswordHasher,
  PrismaAccountPurger,
  RedisSessionRevoker,
} from "@contexts/identity/infrastructure/identity-adapters";
import { PrismaAccountRepository } from "@contexts/identity/infrastructure/prisma-account.repository";
import { SignInLimiterService } from "@contexts/identity/infrastructure/sign-in-limiter.service";
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
    SignInLimiterService,
    { provide: AccountRepository, useClass: PrismaAccountRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: SessionRevoker, useClass: RedisSessionRevoker },
    { provide: AccountPurger, useClass: PrismaAccountPurger },
    // Global: a bot session must be refused on every route, not only the ones under /users.
    { provide: APP_GUARD, useClass: SyntheticIpGuard },
  ],
})
export class IdentityModule {}
