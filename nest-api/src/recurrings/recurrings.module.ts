import { Module } from "@nestjs/common";
import { RecurringsController } from "./recurrings.controller";
import { RecurringsService } from "./recurrings.service";
import { JwtAuthGuard } from "../spendings/guards/jwt-auth.guard";

@Module({
  imports: [],
  controllers: [RecurringsController],
  providers: [RecurringsService, JwtAuthGuard],
})
export class RecurringsModule {}
