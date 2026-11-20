import { Global, Module } from "@nestjs/common";
import { AuthTokenService } from "@users/auth-token.service";

/**
 * Global because `SessionAuthGuard` resolves Bearer tokens and is used by every feature module:
 * each of them would otherwise have to import this one to build the guard.
 */
@Global()
@Module({
  providers: [AuthTokenService],
  exports: [AuthTokenService],
})
export class AuthTokenModule {}
