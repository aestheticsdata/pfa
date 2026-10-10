import { randomUUID } from "node:crypto";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BOTS_MODE } from "#app/config/app.config.js";
import { PrismaService } from "#app/prisma/prisma.service.js";
import { IncidentStatus } from "#prisma-client/enums.js";

import type { AppConfig } from "#app/config/interfaces/configTypes.js";

const MINUTE_MS = 60_000;

/**
 * Mock mode only: two open incidents and one closed, so the banner, the Incidents page and the
 * modal have something to show without anyone attacking anything. Fixed accounts and addresses —
 * documentation ranges (RFC 5737), never real ones — re-created at every boot so every take of the
 * film starts the same.
 */
@Injectable()
export class MockIncidentsSeeder implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.getOrThrow<AppConfig>("app").mode !== BOTS_MODE.mock) {
      return;
    }
    const now = Date.now();
    const at = (minutesAgo: number) => new Date(now - minutesAgo * MINUTE_MS);
    await this.prisma.incident.deleteMany({ where: { app: "pfa" } });
    await this.prisma.incident.createMany({
      data: [
        {
          id: randomUUID(),
          app: "pfa",
          account: "legionary-042@synthetic.test",
          ip: "203.0.113.47",
          userAgent: "python-requests/2.31",
          path: "/api/users",
          attempts: 7,
          firstSeenAt: at(9),
          lastSeenAt: at(3),
          status: IncidentStatus.open,
          pushedAt: at(9),
        },
        {
          id: randomUUID(),
          app: "pfa",
          account: "ceres@synthetic.test",
          ip: "198.51.100.12",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
          path: "/api/dashboard",
          attempts: 2,
          firstSeenAt: at(31),
          lastSeenAt: at(26),
          status: IncidentStatus.open,
          pushedAt: at(31),
        },
        {
          id: randomUUID(),
          app: "pfa",
          account: "legionary-009@synthetic.test",
          ip: "192.0.2.3",
          userAgent: "curl/8.4.0",
          path: "/api/users",
          attempts: 3,
          firstSeenAt: at(2 * 1440 + 4),
          lastSeenAt: at(2 * 1440),
          status: IncidentStatus.disabled,
          pushedAt: at(2 * 1440 + 4),
          resolvedAt: at(2 * 1440 - 30),
        },
      ],
    });
  }
}
