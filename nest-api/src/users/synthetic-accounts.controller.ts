import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { SyntheticAdminGuard } from "@users/guards/synthetic-admin.guard";
import { SyntheticAccountsService } from "@users/synthetic-accounts.service";
import type { PurgeCounts } from "@users/synthetic-purge.util";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";

/**
 * Called by the bot runner on ks-b, on behalf of the bot back-office (PFA-127). Never public: see
 * `SyntheticAdminGuard`. Each call leaves one ECS line, so "who switched this bot off, when" is a
 * single search.
 */
@Controller("internal/synthetic/accounts")
@UseGuards(SyntheticAdminGuard)
export class SyntheticAccountsController {
  constructor(
    private readonly accounts: SyntheticAccountsService,
    @InjectPinoLogger(SyntheticAccountsController.name) private readonly logger: PinoLogger,
  ) {}

  @Post(":email/disable")
  @HttpCode(HttpStatus.OK)
  async disable(@Param("email") email: string): Promise<{ email: string; disabledAt: Date }> {
    const result = await this.accounts.disable(email);
    this.logger.warn(
      { "event.category": "iam", "event.action": "synthetic-account-disabled", "user.name": result.email },
      "synthetic account disabled",
    );
    return result;
  }

  @Delete(":email")
  @HttpCode(HttpStatus.OK)
  async purge(@Param("email") email: string): Promise<{ email: string; deleted: PurgeCounts }> {
    const result = await this.accounts.purge(email);
    this.logger.warn(
      { "event.category": "iam", "event.action": "synthetic-account-purged", "user.name": result.email },
      "synthetic account purged",
    );
    return result;
  }
}
