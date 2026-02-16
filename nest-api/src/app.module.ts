import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import appConfig from "@config/app.config";
import { validate } from "@config/env.validation";
import { LegacyProxyProvider } from "@infrastructure/proxy/legacy-proxy.provider";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "@users/users.module";

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate,
      load: [appConfig],
    }),
  ],
  controllers: [AppController],
  providers: [LegacyProxyProvider],
})
export class AppModule {}
