import { Module } from "@nestjs/common";
import { SpendingsController } from "@spendings/spendings.controller";
import { SpendingsService } from "@spendings/spendings.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

@Module({
  imports: [],
  controllers: [SpendingsController],
  providers: [SpendingsService, SessionAuthGuard],
})
export class SpendingsModule {}
