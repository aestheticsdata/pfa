import { Logger } from "@nestjs/common";
import { DbBackupCronService } from "./db-backup-cron.service";

import type { DbBackupConfig } from "@config/db-backup.config";

// `promisify(exec)` calls this with a node-style callback, so a mock resolves by calling back with
// no error and rejects by calling back with one.
jest.mock("child_process", () => ({
  exec: jest.fn((_command: string, callback: (err: Error | null, stdout: string, stderr: string) => void) =>
    callback(null, "", ""),
  ),
}));

jest.mock("fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ size: 4_194_304 }),
}));

import { exec } from "child_process";

/**
 * COS-422 — the twelve-hourly database backup reports each run to Zeus (COS-398).
 *
 * The assertions are all on the payload that leaves the process, because that payload is the whole
 * feature: before this, a backup failing for three weeks and one succeeding looked identical from
 * outside pm2's log, and a backup skipped for a missing env var looked like nothing at all.
 *
 * Zeus's own validation is what enforces the contract's shape; these tests only cover the part pfa
 * decides — which of `ok` / `failed` / `skipped` each situation is.
 */
describe("DbBackupCronService.handleDbBackup", () => {
  const CONFIG: DbBackupConfig = {
    enabled: true,
    dbUser: "pfa",
    dbPassword: "secret",
    dbName: "pfadb",
    dumpPath: "/var/backups/pfa",
    remoteBackupPath: "/remote/pfa/",
  };

  const makeService = (overrides: Partial<DbBackupConfig> = {}, sshEnabled = true) => {
    const configService = { get: jest.fn().mockReturnValue({ ...CONFIG, ...overrides }) };
    const copyFile = jest.fn().mockResolvedValue(undefined);
    const sshBackup = { enabled: sshEnabled, copyFile };

    return {
      service: new DbBackupCronService(configService as never, sshBackup as never),
      copyFile,
    };
  };

  /** The JSON body of the single report the run produced. */
  const reported = (): Record<string, unknown> => {
    const calls = (global.fetch as jest.Mock).mock.calls as Array<[string, { body: string }]>;
    expect(calls).toHaveLength(1);
    return JSON.parse(calls[0][1].body) as Record<string, unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set after import on purpose: the client must read its configuration at call time, because
    // under Nest `ConfigModule` loads `.env` only after every module in the tree is imported.
    process.env.ZEUS_INGEST_TOKEN = "test-token";
    process.env.ZEUS_APP_NAME = "pfa";
    process.env.ZEUS_INGEST_URL = "http://127.0.0.1:6600/api/cron-runs";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ZEUS_INGEST_TOKEN;
    delete process.env.ZEUS_APP_NAME;
    delete process.env.ZEUS_INGEST_URL;
  });

  describe("a successful backup", () => {
    it("reports ok, naming the cron and the schedule it runs on", async () => {
      const { service } = makeService();

      await service.handleDbBackup();

      expect(reported()).toMatchObject({
        app: "pfa",
        cron: "db-backup",
        schedule: "0 0 */12 * * *",
        status: "ok",
      });
    });

    it("carries the dump's size, so a backup that quietly shrinks is visible", async () => {
      const { service } = makeService();

      await service.handleDbBackup();

      expect(reported().detail).toMatchObject({ bytes: 4_194_304 });
    });

    it("names the remote path it reached in the summary", async () => {
      const { service } = makeService();

      await service.handleDbBackup();

      expect(reported().summary).toContain("/remote/pfa/pfadump.sql");
    });

    // The report must not carry a timezone: the `@Cron` pins none, so the job fires in the
    // process's zone — UTC on ks-b — which is what Zeus assumes by default. Sending Europe/Paris
    // would have Zeus expect every run two hours early in summer.
    it("sends no timezone", async () => {
      const { service } = makeService();

      await service.handleDbBackup();

      expect(reported()).not.toHaveProperty("timezone");
    });
  });

  describe("a backup that cannot run", () => {
    it("reports skipped when backups are disabled", async () => {
      const { service } = makeService({ enabled: false });

      await service.handleDbBackup();

      expect(reported()).toMatchObject({ status: "skipped" });
    });

    it("reports skipped when the ssh target is disabled", async () => {
      const { service } = makeService({}, false);

      await service.handleDbBackup();

      expect(reported()).toMatchObject({ status: "skipped" });
    });

    // The failure this replaces: an env var dropped by a deploy produced no backup, no error and
    // no trace anywhere. The summary has to name the key so the report is actionable on its own.
    it("reports skipped naming the missing configuration key", async () => {
      const { service } = makeService({ dumpPath: "" });

      await service.handleDbBackup();

      const report = reported();
      expect(report).toMatchObject({ status: "skipped" });
      expect(report.summary).toContain("PFA_DUMP_PATH");
    });

    it("does not dump or copy anything when it skips", async () => {
      const { service, copyFile } = makeService({ enabled: false });

      await service.handleDbBackup();

      expect(exec).not.toHaveBeenCalled();
      expect(copyFile).not.toHaveBeenCalled();
    });
  });

  describe("a backup that fails", () => {
    const breakMysqldump = () => {
      (exec as unknown as jest.Mock).mockImplementationOnce((_command: string, callback: (err: Error) => void) =>
        callback(new Error("mysqldump: Got error 1045")),
      );
    };

    it("reports failed with the error in the summary", async () => {
      breakMysqldump();
      const { service } = makeService();

      await service.handleDbBackup();

      const report = reported();
      expect(report).toMatchObject({ status: "failed" });
      expect(report.summary).toContain("1045");
    });

    // The scheduler is left exactly as it was: the previous implementation swallowed the error, and
    // a rethrow here would surface as an unhandled rejection inside `@nestjs/schedule`.
    it("does not throw", async () => {
      breakMysqldump();
      const { service } = makeService();

      await expect(service.handleDbBackup()).resolves.toBeUndefined();
    });
  });

  describe("when Zeus is unreachable", () => {
    // The rule the whole client exists for: reporting must never fail the job.
    it("still completes the backup", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("ECONNREFUSED"));
      const { service, copyFile } = makeService();

      await expect(service.handleDbBackup()).resolves.toBeUndefined();
      expect(copyFile).toHaveBeenCalledTimes(1);
    });
  });
});
