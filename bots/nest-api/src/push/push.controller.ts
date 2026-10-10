import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Actor } from "#app/auth/actor.decorator.js";
import { CsrfGuard } from "#app/auth/guards/csrf.guard.js";
import { SessionAuthGuard } from "#app/auth/guards/session-auth.guard.js";
import { subscriptionSchema, unsubscribeSchema } from "#app/push/push.schemas.js";
import { PushService } from "#app/push/push.service.js";

import type { AuditActor } from "#app/audit/interfaces/auditTypes.js";
import type { PushState } from "#app/contracts/interfaces/panelTypes.js";
import type { UnsubscribeBody } from "#app/panel/interfaces/panelBodyTypes.js";
import type { PushSubscriptionInput } from "#app/push/interfaces/pushTypes.js";

/** This device subscribing to incident alarms. */
@Controller("push")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get()
  async state(): Promise<PushState> {
    const key = this.push.key();
    return { available: key !== null, publicKey: key, devices: await this.push.devices() };
  }

  @Post("subscriptions")
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @Body({ schema: subscriptionSchema }) subscription: PushSubscriptionInput,
    @Actor() actor: AuditActor,
  ): Promise<{ ok: true }> {
    await this.push.subscribe(subscription, actor.userAgent);
    return { ok: true };
  }

  @Delete("subscriptions")
  async unsubscribe(@Body({ schema: unsubscribeSchema }) body: UnsubscribeBody): Promise<{ ok: true }> {
    await this.push.unsubscribe(body.endpoint);
    return { ok: true };
  }
}
