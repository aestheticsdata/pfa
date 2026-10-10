import { randomUUID } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AppsService } from "#app/apps/apps.service.js";
import { PrismaService } from "#app/prisma/prisma.service.js";
import { PushService } from "#app/push/push.service.js";
import { IncidentStatus } from "#prisma-client/enums.js";

import type { IncidentView } from "#app/contracts/interfaces/panelTypes.js";
import type { AccountResolution, AppAlert } from "#app/incidents/interfaces/incidentTypes.js";
import type { Incident } from "#prisma-client/client.js";

/**
 * `synthetic-foreign-ip` alerts, grouped into incidents by **account + address**: while one is
 * open, every new line from the same pair only bumps its `attempts` — one alarm, not a hundred.
 * The phone is told once per new incident; one that comes back after being closed is new again.
 */
@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly apps: AppsService,
  ) {}

  async record({ app, alert }: AppAlert): Promise<void> {
    const open = await this.prisma.incident.findFirst({
      where: { app, account: alert.account, ip: alert.ip, status: IncidentStatus.open },
      orderBy: { lastSeenAt: "desc" },
    });
    if (open) {
      await this.prisma.incident.update({
        where: { id: open.id },
        data: {
          attempts: { increment: 1 },
          lastSeenAt: alert.at > open.lastSeenAt ? alert.at : open.lastSeenAt,
          userAgent: alert.userAgent ?? open.userAgent,
          path: alert.path ?? open.path,
        },
      });
      return;
    }
    const incident = await this.prisma.incident.create({
      data: {
        id: randomUUID(),
        app,
        account: alert.account,
        userId: alert.userId,
        ip: alert.ip,
        userAgent: alert.userAgent,
        path: alert.path,
        firstSeenAt: alert.at,
        lastSeenAt: alert.at,
      },
    });
    const host = this.apps.list().find((entry) => entry.id === app)?.host ?? app;
    const delivered = await this.push.notify({
      title: `Bot account used outside ${host}`,
      body: `${alert.account} · ${alert.ip}`,
      url: `/${app}/incidents`,
      tag: `${app}:${alert.account}:${alert.ip}`,
    });
    if (delivered) {
      await this.prisma.incident.update({ where: { id: incident.id }, data: { pushedAt: new Date() } });
    }
  }

  async list(app: string): Promise<IncidentView[]> {
    const rows = await this.prisma.incident.findMany({ where: { app }, orderBy: { lastSeenAt: "desc" }, take: 200 });
    return rows.map(toView);
  }

  async openCount(app: string): Promise<number> {
    return this.prisma.incident.count({ where: { app, status: IncidentStatus.open } });
  }

  async acknowledge(app: string, id: string): Promise<IncidentView> {
    const incident = await this.prisma.incident.findFirst({ where: { id, app } });
    if (!incident) {
      throw new NotFoundException("Unknown incident", { errorCode: "INCIDENT_UNKNOWN" });
    }
    const updated = await this.prisma.incident.update({
      where: { id },
      data: { status: IncidentStatus.acknowledged, resolvedAt: new Date() },
    });
    return toView(updated);
  }

  /** The account was disabled or purged: its open incidents are closed with that outcome. */
  async resolveAccount(resolution: AccountResolution): Promise<void> {
    await this.prisma.incident.updateMany({
      where: { app: resolution.app, account: resolution.account, status: IncidentStatus.open },
      data: { status: resolution.status, resolvedAt: new Date() },
    });
  }

  async get(app: string, id: string): Promise<IncidentView | null> {
    const incident = await this.prisma.incident.findFirst({ where: { id, app } });
    return incident ? toView(incident) : null;
  }
}

function toView(incident: Incident): IncidentView {
  return {
    id: incident.id,
    account: incident.account,
    userId: incident.userId,
    ip: incident.ip,
    userAgent: incident.userAgent,
    path: incident.path,
    attempts: incident.attempts,
    firstSeenAt: incident.firstSeenAt.toISOString(),
    lastSeenAt: incident.lastSeenAt.toISOString(),
    status: incident.status,
    pushed: incident.pushedAt !== null,
  };
}
