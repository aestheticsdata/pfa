import { Global, Module } from "@nestjs/common";
import { AppsService } from "#app/apps/apps.service.js";

@Global()
@Module({ providers: [AppsService], exports: [AppsService] })
export class AppsModule {}
