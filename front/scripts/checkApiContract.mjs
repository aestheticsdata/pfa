#!/usr/bin/env node
/**
 * The API contract, checked against the API as it is now (PFA-257).
 *
 * Captures every endpoint the front parses from the LOCAL api into a scratch folder, then runs
 * `apiContract.test.ts` on that capture: red means the api sends a shape the front's schemas
 * refuse — a field added or dropped on one side only. The committed fixtures are left alone.
 * Called by `nest-api/deploy-api.sh` before a deploy when the local api answers.
 *
 *   pnpm contract:check
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "pfa-api-contract-"));

try {
  execFileSync(process.execPath, [join(ROOT, "scripts/captureApiFixtures.mjs")], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, CAPTURE_FIXTURES_DIR: dir },
  });
  execFileSync(join(ROOT, "node_modules/.bin/vitest"), ["run", "src/schemas/__tests__/apiContract.test.ts"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, API_CONTRACT_FIXTURES_DIR: dir },
  });
} catch {
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
