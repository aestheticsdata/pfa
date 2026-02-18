import { Module } from "@nestjs/common";
import { SpendingsController } from "@spendings/spendings.controller";
import { SpendingsService } from "@spendings/spendings.service";
import { JwtAuthGuard } from "@spendings/guards/jwt-auth.guard";

@Module({
  imports: [],
  controllers: [SpendingsController],
  providers: [SpendingsService, JwtAuthGuard],
})
export class SpendingsModule {}
