import { registerAs } from "@nestjs/config";
import { z } from "zod";

import type { AppConfig } from "#app/config/interfaces/configTypes.js";

export const BOTS_MODE = {
  live: "live",
  mock: "mock",
} as const;

/**
 * The environment, validated once at boot through `ConfigModule`'s Standard Schema support
 * (Nest 12): a back-office with no database, or a short session secret, refuses to start.
 */
export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(7200),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_SECRET: z.string().min(32),
  BOTS_MODE: z.enum([BOTS_MODE.live, BOTS_MODE.mock]).default(BOTS_MODE.live),
  BOTS_APPS_FILE: z.string().default("config/apps.json"),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@bots.1991computer.com"),
});

export default registerAs("app", (): AppConfig => {
  const env = envSchema.parse(process.env);
  return {
    port: env.PORT,
    mode: env.BOTS_MODE,
    appsFile: env.BOTS_APPS_FILE,
    vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
    vapidPrivateKey: env.VAPID_PRIVATE_KEY || null,
    vapidSubject: env.VAPID_SUBJECT,
  };
});
