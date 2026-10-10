import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "#app/app.controller.js";
import { AppsModule } from "#app/apps/apps.module.js";
import { AuditModule } from "#app/audit/audit.module.js";
import { AuthModule } from "#app/auth/auth.module.js";
import appConfig, { envSchema } from "#app/config/app.config.js";
import { PanelModule } from "#app/panel/panel.module.js";
import { PrismaModule } from "#app/prisma/prisma.module.js";
import { PushModule } from "#app/push/push.module.js";
import { RedisModule } from "#app/redis/redis.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env", validationSchema: envSchema, load: [appConfig] }),
    PrismaModule,
    RedisModule,
    AuditModule,
    AuthModule,
    AppsModule,
    PushModule,
    PanelModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
