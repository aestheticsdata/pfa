import { Module } from "@nestjs/common";
import { ExceptionalsController } from "@exceptionals/exceptionals.controller";
import { ExceptionalsService } from "@exceptionals/exceptionals.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

@Module({
  imports: [],
  controllers: [ExceptionalsController],
  providers: [ExceptionalsService, SessionAuthGuard],
})
export class ExceptionalsModule {}
