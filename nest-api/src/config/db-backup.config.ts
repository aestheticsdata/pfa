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
  const enabled = process.env.NODE_ENV === "production";

  return {
    enabled,
    dbUser: process.env.DB_USER ?? "",
    dbPassword: process.env.DB_PASSWORD ?? "",
    dbName: process.env.DB ?? "",
    dumpPath: process.env.PFA_DUMP_PATH ?? "",
    remoteBackupPath: process.env.PFA_BACKUP_SERVER_PATH ?? "",
  };
});
