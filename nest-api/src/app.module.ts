import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { LoggerModule } from "nestjs-pino";
import appConfig from "@config/app.config";
import sshBackupConfig from "@config/ssh-backup.config";
import dbBackupConfig from "@config/db-backup.config";
import { validate } from "@config/env.validation";
import { AllExceptionsFilter, buildLoggerParams, TraceIdMiddleware } from "@infrastructure/logger";
import { RedisModule } from "@redis/redis.module";
import { SshBackupModule } from "@infrastructure/ssh-backup/ssh-backup.module";
import { DbBackupModule } from "@infrastructure/db-backup/db-backup.module";
import { PrismaModule } from "./prisma/prisma.module";
import { MonitoringModule } from "./monitoring/monitoring.module";
import { UsersModule } from "@users/users.module";
import { SpendingsModule } from "@spendings/spendings.module";
import { RecurringsModule } from "@recurrings/recurrings.module";
import { DashboardModule } from "@dashboard/dashboard.module";
import { StatsModule } from "@stats/stats.module";
import { CategoriesModule } from "@categories/categories.module";
import { ExceptionalsModule } from "@exceptionals/exceptionals.module";

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
    SpendingsModule,
    RecurringsModule,
    DashboardModule,
    StatsModule,
    CategoriesModule,
    ExceptionalsModule,
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
    consumer.apply(TraceIdMiddleware).forRoutes("*");
  }
}
