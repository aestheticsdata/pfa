import { Module } from "@nestjs/common";
import { RecurringsController } from "@recurrings/recurrings.controller";
import { RecurringsService } from "@recurrings/recurrings.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

@Module({
  imports: [],
  controllers: [RecurringsController],
  providers: [RecurringsService, SessionAuthGuard],
})
export class RecurringsModule {}
