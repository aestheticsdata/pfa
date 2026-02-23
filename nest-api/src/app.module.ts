import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import appConfig from "@config/app.config";
import sshBackupConfig from "@config/ssh-backup.config";
import dbBackupConfig from "@config/db-backup.config";
import { validate } from "@config/env.validation";
import { RedisModule } from "@redis/redis.module";
import { SshBackupModule } from "@infrastructure/ssh-backup/ssh-backup.module";
import { DbBackupModule } from "@infrastructure/db-backup/db-backup.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "@users/users.module";
import { SpendingsModule } from "@spendings/spendings.module";
import { RecurringsModule } from "@recurrings/recurrings.module";
import { DashboardModule } from "@dashboard/dashboard.module";
import { StatsModule } from "@stats/stats.module";
import { CategoriesModule } from "@categories/categories.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RedisModule,
    PrismaModule,
    UsersModule,
    SpendingsModule,
    RecurringsModule,
    DashboardModule,
    StatsModule,
    CategoriesModule,
    SshBackupModule,
    DbBackupModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate,
      load: [appConfig, sshBackupConfig, dbBackupConfig],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
