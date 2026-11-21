import { LOG_LEVELS, NODE_ENV } from "@config/env";
import { plainToInstance } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  ValidateIf,
  validateSync,
} from "class-validator";

const BOOLEAN_STRINGS = ["true", "false"];

/** Required in production — the backups and the receipts' storage only run there. */
const inProductionOrSet = (name: keyof EnvironmentVariables) => (vars: EnvironmentVariables) =>
  vars.NODE_ENV === NODE_ENV.production || vars[name] !== undefined;

/**
 * Every variable the API reads (PFA-264), checked when the app starts. Read them through
 * `env` (`@config/env`), never `process.env`. `.env.example` documents each one.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsNumberString()
  PORT!: string;

  @Matches(/^(mysql|mariadb):\/\/.+/, { message: "DATABASE_URL must be a mysql:// or mariadb:// URL" })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16)
  SESSION_SECRET!: string;

  @IsOptional()
  @Matches(/^rediss?:\/\/.+/, { message: "REDIS_URL must be a redis:// URL" })
  REDIS_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  FRONTEND_URL?: string;

  @IsOptional()
  @IsIn(BOOLEAN_STRINGS)
  COOKIE_SECURE?: string;

  @IsOptional()
  @IsIn(LOG_LEVELS)
  LOG_LEVEL?: string;

  @ValidateIf(inProductionOrSet("PFA_INVOICES_IMAGES_PATH"))
  @IsNotEmpty()
  PFA_INVOICES_IMAGES_PATH?: string;

  @IsOptional()
  @IsIn(BOOLEAN_STRINGS)
  SIGNUPS_ENABLED?: string;

  /** May be empty: no bot address allowed. */
  @IsOptional()
  @IsString()
  SYNTHETIC_ALLOWED_IPS?: string;

  /** Unset: the bot back-office route answers 404. */
  @IsOptional()
  @MinLength(32)
  SYNTHETIC_ADMIN_TOKEN?: string;

  @ValidateIf(inProductionOrSet("DB_USER"))
  @IsNotEmpty()
  DB_USER?: string;

  @ValidateIf(inProductionOrSet("DB_PASSWORD"))
  @IsNotEmpty()
  DB_PASSWORD?: string;

  @ValidateIf(inProductionOrSet("DB"))
  @IsNotEmpty()
  DB?: string;

  @ValidateIf(inProductionOrSet("PFA_DUMP_PATH"))
  @IsNotEmpty()
  PFA_DUMP_PATH?: string;

  @ValidateIf(inProductionOrSet("PFA_BACKUP_SERVER_PATH"))
  @IsNotEmpty()
  PFA_BACKUP_SERVER_PATH?: string;

  @ValidateIf(inProductionOrSet("PFA_BACKUP_SERVER_IP"))
  @IsNotEmpty()
  PFA_BACKUP_SERVER_IP?: string;

  @ValidateIf(inProductionOrSet("DEBIAN_OVH_VPS_SSH_USER"))
  @IsNotEmpty()
  DEBIAN_OVH_VPS_SSH_USER?: string;

  @ValidateIf(inProductionOrSet("DEBIAN_OVH_VPS_SSH_KEY_PATH"))
  @IsNotEmpty()
  DEBIAN_OVH_VPS_SSH_KEY_PATH?: string;

  @ValidateIf(inProductionOrSet("PFA_BACKUP_INVOICES_SERVER_PATH"))
  @IsNotEmpty()
  PFA_BACKUP_INVOICES_SERVER_PATH?: string;

  /** Cron reporting (COS-422): all three or none; unset = a silent no-op. */
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  ZEUS_INGEST_URL?: string;

  @IsOptional()
  @IsString()
  ZEUS_INGEST_TOKEN?: string;

  @IsOptional()
  @IsString()
  ZEUS_APP_NAME?: string;
}

/** Stops the start-up on the first look at the environment, naming every variable at fault. */
export function validate(config: Record<string, unknown>): Record<string, unknown> {
  const vars = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(vars, { skipMissingProperties: false });

  if (errors.length > 0) {
    const lines = errors.map((error) => `  ${error.property}: ${Object.values(error.constraints ?? {}).join("; ")}`);
    throw new Error(`Invalid environment:\n${lines.join("\n")}`);
  }
  return config;
}
