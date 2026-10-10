import { Module } from "@nestjs/common";
import { PushController } from "#app/push/push.controller.js";
import { PushService } from "#app/push/push.service.js";

@Module({ controllers: [PushController], providers: [PushService], exports: [PushService] })
export class PushModule {}
