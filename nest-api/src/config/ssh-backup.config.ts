import { registerAs } from "@nestjs/config";
import { readFileSync } from "fs";

export interface SshBackupConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  privateKey: Buffer | null;
  backupInvoicesPath: string;
}

export default registerAs("sshBackup", (): SshBackupConfig => {
  const enabled = process.env.NODE_ENV === "production";
  const keyPath = process.env.DEBIAN_OVH_VPS_SSH_KEY_PATH;

  return {
    enabled,
    host: process.env.PFA_BACKUP_SERVER_IP ?? "",
    port: 22,
    username: process.env.DEBIAN_OVH_VPS_SSH_USER ?? "",
    privateKey: enabled && keyPath ? readFileSync(keyPath) : null,
    backupInvoicesPath: process.env.PFA_BACKUP_INVOICES_SERVER_PATH ?? "",
  };
});
