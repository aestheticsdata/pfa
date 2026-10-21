import { env } from "@config/env";
import { registerAs } from "@nestjs/config";

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
