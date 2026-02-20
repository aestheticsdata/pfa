import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";
import { homedir } from "os";
import { readFileSync } from "fs";
import { SshBackupService } from "@infrastructure/ssh-backup/ssh-backup.service";
import { SshBackupConfig } from "@config/ssh-backup.config";

const FIXTURE_IMAGE = join(__dirname, "fixtures", "galaxy.jpg");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name} — see .env.ssh-test.example`);
  return value.startsWith("~") ? join(homedir(), value.slice(1)) : value;
}

/**
 * Integration tests for SshBackupService against the real backup server.
 *
 * Requires SSH access to the backup VPS.
 * Copy .env.ssh-test.example → .env.ssh-test and fill in your values,
 * then run: pnpm test:ssh
 */
describe("SshBackupService (integration)", () => {
  let service: SshBackupService;
  let backupPath: string;
  const testUserID = "00000000-0000-0000-0000-e2e-ssh-test";
  const testFilename = "galaxy-test.jpg";

  beforeAll(async () => {
    const host = requireEnv("PFA_BACKUP_SERVER_IP");
    const username = requireEnv("DEBIAN_OVH_VPS_SSH_USER");
    const keyPath = requireEnv("DEBIAN_OVH_VPS_SSH_KEY_PATH");
    backupPath = requireEnv("PFA_BACKUP_INVOICES_SERVER_PATH");

    const sshConfig: SshBackupConfig = {
      enabled: true,
      host,
      port: 22,
      username,
      privateKey: readFileSync(keyPath),
      backupInvoicesPath: backupPath,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [SshBackupService],
    })
      .overrideProvider(ConfigService)
      .useValue({ getOrThrow: () => sshConfig })
      .compile();

    service = moduleFixture.get<SshBackupService>(SshBackupService);
  }, 15000);

  it("should copy a file to the backup server", async () => {
    const remotePath = `${backupPath}${testUserID}/${testFilename}`;
    await service.copyFile(FIXTURE_IMAGE, remotePath);

    const exists = await service.fileExists(remotePath);
    expect(exists).toBe(true);
  }, 30000);

  it("should confirm the copied file exists", async () => {
    const remotePath = `${backupPath}${testUserID}/${testFilename}`;
    const exists = await service.fileExists(remotePath);
    expect(exists).toBe(true);
  }, 15000);

  it("should delete the file from the backup server", async () => {
    const remotePath = `${backupPath}${testUserID}/${testFilename}`;
    await service.deleteFile(remotePath);

    const exists = await service.fileExists(remotePath);
    expect(exists).toBe(false);
  }, 30000);

  it("should handle deleting a non-existent file gracefully", async () => {
    const remotePath = `${backupPath}${testUserID}/does-not-exist.jpg`;
    await expect(service.deleteFile(remotePath)).resolves.not.toThrow();
  }, 15000);
});
