import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import appConfig from "@config/app.config";
import { validate } from "@config/env.validation";
import { LegacyProxyProvider } from "@infrastructure/proxy/legacy-proxy.provider";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? "development"}`,
      validate,
      load: [appConfig],
    }),
  ],
  controllers: [AppController],
  providers: [LegacyProxyProvider],
})
export class AppModule {}
