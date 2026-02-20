import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import appConfig from "@config/app.config";
import sshBackupConfig from "@config/ssh-backup.config";
import { validate } from "@config/env.validation";
import { LegacyProxyProvider } from "@infrastructure/proxy/legacy-proxy.provider";
import { SshBackupModule } from "@infrastructure/ssh-backup/ssh-backup.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "@users/users.module";
import { SpendingsModule } from "@spendings/spendings.module";

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    SpendingsModule,
    SshBackupModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate,
      load: [appConfig, sshBackupConfig],
    }),
  ],
  controllers: [AppController],
  providers: [LegacyProxyProvider],
})
export class AppModule {}
