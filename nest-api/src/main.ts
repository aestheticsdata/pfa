import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";
import { AppConfig } from "@config/app.config";
import { formatRouteLog } from "@infrastructure/logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>("app");

  app.setGlobalPrefix("api");

  app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
    const url = req.originalUrl ?? req.url ?? req.path ?? "";
    console.log(formatRouteLog(req.method, url, "Nest"));
    next();
  });

  await app.listen(appConfig.port);
}

void bootstrap();
