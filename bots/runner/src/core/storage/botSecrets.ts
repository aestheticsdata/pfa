import { randomBytes } from "node:crypto";
import { readJson, writeJson } from "@core/storage/jsonStore";

import type { JsonFile } from "@core/interfaces/storageTypes";

const PASSWORD_BYTES = 32;

/**
 * The bots' passwords: generated here (256 random bits each), kept in one 0600 file in the
 * runner's state directory on ks-b — never in the repo, never in a log line, never sent anywhere
 * but to the bot's own app at sign-in. Keyed by email.
 */
export class BotSecrets {
  private constructor(
    private readonly file: JsonFile,
    private readonly passwords: Record<string, string>,
  ) {}

  static async load(path: string): Promise<BotSecrets> {
    const file = { path, mode: 0o600 };
    return new BotSecrets(file, await readJson<Record<string, string>>(file, {}));
  }

  has(email: string): boolean {
    return email in this.passwords;
  }

  /** The bot's password, created (and saved) the first time it is asked for. */
  async passwordFor(email: string): Promise<string> {
    const existing = this.passwords[email];
    if (existing) {
      return existing;
    }
    const created = randomBytes(PASSWORD_BYTES).toString("base64url");
    this.passwords[email] = created;
    await writeJson(this.file, this.passwords);
    return created;
  }
}
