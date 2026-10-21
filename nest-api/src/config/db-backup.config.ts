import { registerAs } from "@nestjs/config";
import { env } from "@config/env";

export interface DbBackupConfig {
  enabled: boolean;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dumpPath: string;
  remoteBackupPath: string;
}

export default registerAs("dbBackup", (): DbBackupConfig => {
  return { enabled: env.isProduction, ...env.dbBackup };
});
