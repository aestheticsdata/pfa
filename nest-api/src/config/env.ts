import * as path from "node:path";

/**
 * NODE_ENV values the code branches on. Anything else behaves like development.
 */
export const NODE_ENV = {
  production: "production",
  test: "test",
  development: "development",
} as const;

/** The pino levels LOG_LEVEL may name. */
export const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const DEFAULT_REDIS_URL = "redis://localhost:6379";
const DEFAULT_FRONTEND_URL = "http://localhost:3000";
const DEFAULT_ZEUS_INGEST_URL = "http://127.0.0.1:6600/api/cron-runs";

/**
 * The one place the API reads its environment (PFA-264): typed, with each default written once.
 * `env.validation.ts` checks the same variables at boot, so a missing or malformed one stops the
 * start-up with its name rather than failing at the first request or the first cron.
 *
 * Getters, read at call time and never cached: `ConfigModule` loads `.env` after the import tree
 * has been evaluated (see `zeus-report.ts`), and the e2e suites change a few of these mid-run.
 */
function nodeEnv(): string {
  return process.env.NODE_ENV ?? NODE_ENV.development;
}

export const env = {
  get nodeEnv(): string {
    return nodeEnv();
  },
  get isProduction(): boolean {
    return nodeEnv() === NODE_ENV.production;
  },
  get isTest(): boolean {
    return nodeEnv() === NODE_ENV.test;
  },
  get port(): number {
    return Number(process.env.PORT);
  },
  get databaseUrl(): string {
    return process.env.DATABASE_URL ?? "";
  },
  get redisUrl(): string {
    return process.env.REDIS_URL ?? DEFAULT_REDIS_URL;
  },
  get sessionSecret(): string {
    return process.env.SESSION_SECRET ?? "";
  },
  /** Secure cookies in production, unless explicitly turned off (production without HTTPS). */
  get cookieSecure(): boolean {
    return process.env.COOKIE_SECURE !== "false" && nodeEnv() === NODE_ENV.production;
  },
  get frontendUrl(): string {
    return process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL;
  },
  get logLevel(): string | undefined {
    return process.env.LOG_LEVEL;
  },
  get invoicesPath(): string {
    return process.env.PFA_INVOICES_IMAGES_PATH ?? path.resolve(process.cwd(), "invoicesUpload");
  },
  /** Sign-ups are open unless explicitly closed. */
  get signupsEnabled(): boolean {
    return process.env.SIGNUPS_ENABLED !== "false";
  },
  /** Comma-separated client addresses the bot accounts may be used from (PFA-122). */
  get syntheticAllowedIps(): string | undefined {
    return process.env.SYNTHETIC_ALLOWED_IPS;
  },
  get syntheticAdminToken(): string | undefined {
    return process.env.SYNTHETIC_ADMIN_TOKEN;
  },
  get dbBackup() {
    return {
      dbUser: process.env.DB_USER ?? "",
      dbPassword: process.env.DB_PASSWORD ?? "",
      dbName: process.env.DB ?? "",
      dumpPath: process.env.PFA_DUMP_PATH ?? "",
      remoteBackupPath: process.env.PFA_BACKUP_SERVER_PATH ?? "",
    };
  },
  get sshBackup() {
    return {
      host: process.env.PFA_BACKUP_SERVER_IP ?? "",
      username: process.env.DEBIAN_OVH_VPS_SSH_USER ?? "",
      keyPath: process.env.DEBIAN_OVH_VPS_SSH_KEY_PATH,
      invoicesPath: process.env.PFA_BACKUP_INVOICES_SERVER_PATH ?? "",
    };
  },
  get zeus() {
    return {
      url: process.env.ZEUS_INGEST_URL ?? DEFAULT_ZEUS_INGEST_URL,
      token: process.env.ZEUS_INGEST_TOKEN,
      app: process.env.ZEUS_APP_NAME,
    };
  },
};
