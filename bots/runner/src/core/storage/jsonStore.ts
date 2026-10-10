import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { JsonFile } from "@core/interfaces/storageTypes";

/** Reads a JSON file, or the fallback when it does not exist yet. */
export async function readJson<T>(file: JsonFile, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file.path, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

/** Atomic write (temp file + rename), so a crash mid-write never leaves half a ledger behind. */
export async function writeJson(file: JsonFile, value: unknown): Promise<void> {
  await mkdir(dirname(file.path), { recursive: true, mode: 0o700 });
  const tmp = `${file.path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: file.mode ?? 0o600 });
  await chmod(tmp, file.mode ?? 0o600);
  await rename(tmp, file.path);
}
