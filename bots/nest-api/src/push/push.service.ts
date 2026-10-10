import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import webpush from "web-push";
import { PrismaService } from "#app/prisma/prisma.service.js";

import type { AppConfig } from "#app/config/interfaces/configTypes.js";
import type { PushMessage, PushSubscriptionInput } from "#app/push/interfaces/pushTypes.js";

/** The push service says the subscription is gone for good: forget it. */
const GONE = new Set([404, 410]);

/**
 * Incident alarms on the phone (PFA-127): standard Web Push with VAPID keys — the back-office's
 * own service worker receives them, no third-party relay. Unconfigured keys = no push, nothing
 * else breaks.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly publicKey: string | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const app = config.getOrThrow<AppConfig>("app");
    this.publicKey = app.vapidPublicKey && app.vapidPrivateKey ? app.vapidPublicKey : null;
    if (app.vapidPublicKey && app.vapidPrivateKey) {
      webpush.setVapidDetails(app.vapidSubject, app.vapidPublicKey, app.vapidPrivateKey);
    }
  }

  /** The key a browser subscribes with; null when push is not configured. */
  key(): string | null {
    return this.publicKey;
  }

  async devices(): Promise<number> {
    return this.prisma.pushSubscription.count();
  }

  async subscribe(subscription: PushSubscriptionInput, userAgent: string | null): Promise<void> {
    const data = { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent };
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: { id: randomUUID(), endpoint: subscription.endpoint, ...data },
      update: data,
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  /** Sends to every subscribed device. True when at least one accepted it. Never throws. */
  async notify(message: PushMessage): Promise<boolean> {
    if (!this.publicKey) {
      return false;
    }
    const devices = await this.prisma.pushSubscription.findMany();
    let delivered = false;
    for (const device of devices) {
      try {
        await webpush.sendNotification(
          { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
          JSON.stringify(message),
          { TTL: 24 * 60 * 60, urgency: "high" },
        );
        delivered = true;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode ?? 0;
        if (GONE.has(status)) {
          await this.prisma.pushSubscription.deleteMany({ where: { id: device.id } });
        } else {
          this.logger.error(`push to a device failed: ${String(error)}`);
        }
      }
    }
    return delivered;
  }
}
