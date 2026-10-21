import { readFileSync } from "node:fs";
import { env } from "@config/env";
import { registerAs } from "@nestjs/config";

export interface SshBackupConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  privateKey: Buffer | null;
  backupInvoicesPath: string;
}

export default registerAs("sshBackup", (): SshBackupConfig => {
  const enabled = env.isProduction;
  const { host, username, keyPath, invoicesPath } = env.sshBackup;

  return {
    enabled,
    host,
    port: 22,
    username,
    privateKey: enabled && keyPath ? readFileSync(keyPath) : null,
    backupInvoicesPath: invoicesPath,
  };
});
