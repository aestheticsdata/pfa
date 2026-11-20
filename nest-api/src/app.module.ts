import appConfig from "@config/app.config";
import dbBackupConfig from "@config/db-backup.config";
import { validate } from "@config/env.validation";
import sshBackupConfig from "@config/ssh-backup.config";
import { AnalyticsModule } from "@contexts/analytics/analytics.module";
import { BudgetPlanningModule } from "@contexts/budget-planning/budget-planning.module";
import { PriceComparisonModule } from "@contexts/price-comparison/price-comparison.module";
import { ReceiptReadingModule } from "@contexts/receipt-reading/receipt-reading.module";
import { SpendingModule } from "@contexts/spending/spending.module";
import { DbBackupModule } from "@infrastructure/db-backup/db-backup.module";
import { AllExceptionsFilter, buildLoggerParams, TraceIdMiddleware } from "@infrastructure/logger";
import { SshBackupModule } from "@infrastructure/ssh-backup/ssh-backup.module";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { RedisModule } from "@redis/redis.module";
import { UsersModule } from "@users/users.module";
import { LoggerModule } from "nestjs-pino";
import { MonitoringModule } from "./monitoring/monitoring.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    // First in the list so Nest's own startup lines already go through pino. Together with
    // `bufferLogs` in main.ts, that makes the very first line written to stdout parsable rather
    // than Nest's coloured console format.
    LoggerModule.forRoot(buildLoggerParams()),
    ScheduleModule.forRoot(),
    RedisModule,
    PrismaModule,
    MonitoringModule,
    UsersModule,
    SpendingModule,
    ReceiptReadingModule,
    PriceComparisonModule,
    BudgetPlanningModule,
    AnalyticsModule,
    SshBackupModule,
    DbBackupModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate,
      load: [appConfig, sshBackupConfig, dbBackupConfig],
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      // Registered globally rather than controller by controller: a controller added later is
      // covered because it exists, not because someone remembered.
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Every route, so that a line written anywhere during a request carries the same trace.id.
    consumer.apply(TraceIdMiddleware).forRoutes("{*splat}");
  }
}
