import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "#prisma-client/client.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const parsed = new URL(process.env.DATABASE_URL ?? "");
    super({
      adapter: new PrismaMariaDb({
        // The mariadb driver resolves "localhost" to ::1, where MySQL isn't listening.
        host: parsed.hostname === "localhost" ? "127.0.0.1" : parsed.hostname,
        port: Number.parseInt(parsed.port || "3306", 10),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace("/", ""),
        connectionLimit: 5,
        allowPublicKeyRetrieval: true,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
