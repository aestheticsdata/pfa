import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "ssh2";
import { SshBackupConfig } from "@config/ssh-backup.config";

import type { SFTPWrapper } from "ssh2";

@Injectable()
export class SshBackupService implements OnModuleDestroy {
  private readonly logger = new Logger(SshBackupService.name);
  private readonly config: SshBackupConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.getOrThrow<SshBackupConfig>("sshBackup");
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  get backupInvoicesPath(): string {
    return this.config.backupInvoicesPath;
  }

  onModuleDestroy() {
    this.logger.log("SSH backup service destroyed");
  }

  async copyFile(localPath: string, remotePath: string): Promise<void> {
    if (!this.config.enabled) return;

    const sftp = await this.connect();
    try {
      await this.ensureRemoteDir(sftp, remotePath);
      await new Promise<void>((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, {}, (err) => (err ? reject(err) : resolve()));
      });
      this.logger.log(`Backup copy OK: ${remotePath}`);
    } finally {
      sftp.end();
    }
  }

  async deleteFile(remotePath: string): Promise<void> {
    if (!this.config.enabled) return;

    const sftp = await this.connect();
    try {
      await new Promise<void>((resolve, reject) => {
        sftp.unlink(remotePath, (err) => {
          if (err && (err as { code?: number | string }).code == 2) {
            this.logger.warn(`Backup file not found (already deleted?): ${remotePath}`);
            resolve();
            return;
          }
          err ? reject(err) : resolve();
        });
      });
      this.logger.log(`Backup delete OK: ${remotePath}`);
    } finally {
      sftp.end();
    }
  }

  async fileExists(remotePath: string): Promise<boolean> {
    const sftp = await this.connect();
    try {
      return await new Promise<boolean>((resolve) => {
        sftp.stat(remotePath, (err) => resolve(!err));
      });
    } finally {
      sftp.end();
    }
  }

  private connect(): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      conn.on("error", (err) => {
        this.logger.error(`SSH connection error: ${err.message}`);
        reject(err);
      });
      conn.on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }
          sftp.on("close", () => conn.end());
          resolve(sftp);
        });
      });
      conn.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        privateKey: this.config.privateKey ?? undefined,
      });
    });
  }

  private async ensureRemoteDir(sftp: SFTPWrapper, filePath: string): Promise<void> {
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    await this.mkdirRecursive(sftp, dir);
  }

  private mkdirRecursive(sftp: SFTPWrapper, dir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      sftp.stat(dir, (err) => {
        if (!err) {
          resolve();
          return;
        }
        const parent = dir.substring(0, dir.lastIndexOf("/"));
        this.mkdirRecursive(sftp, parent)
          .then(() => {
            sftp.mkdir(dir, (mkdirErr) => {
              if (mkdirErr && (mkdirErr as { code?: number | string }).code != 4) {
                reject(mkdirErr);
                return;
              }
              resolve();
            });
          })
          .catch(reject);
      });
    });
  }
}
