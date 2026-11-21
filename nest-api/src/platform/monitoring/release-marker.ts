import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ReleaseMarker {
  version: string;
  commit: string;
}

/**
 * `release.json` is written next to `package.json` by `deploy-api.sh` at deploy time. It is the
 * only source for `app_build_info` and the health `version` field (IKN-2): when it is absent or
 * unreadable the answer is `null`, and the consumers show nothing — never a value rebuilt from
 * `package.json`, the directory name or anything else (Iknos UI spec §8.7).
 */
export function readReleaseMarker(dir: string = process.cwd()): ReleaseMarker | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(join(dir, "release.json"), "utf8"));
  } catch {
    return null;
  }

  const { version, commit } = parsed as { version?: unknown; commit?: unknown };
  if (typeof version !== "string" || version === "" || typeof commit !== "string" || commit === "") {
    return null;
  }

  return { version, commit };
}
