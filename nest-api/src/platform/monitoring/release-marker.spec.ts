import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readReleaseMarker } from "./release-marker";

/**
 * The release marker is what feeds `app_build_info` and the health `version` field (IKN-2).
 * Its one hard rule comes from the Iknos UI spec (§8.7): when the marker is missing or broken,
 * the answer is `null` — never a reconstructed or guessed version.
 */
describe("readReleaseMarker", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "release-marker-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reads version and commit from release.json", () => {
    writeFileSync(join(dir, "release.json"), JSON.stringify({ version: "2.19.0", commit: "a41c9e2" }));

    expect(readReleaseMarker(dir)).toEqual({ version: "2.19.0", commit: "a41c9e2" });
  });

  it("ignores extra fields the deploy script may add", () => {
    writeFileSync(
      join(dir, "release.json"),
      JSON.stringify({ version: "2.19.0", commit: "a41c9e2", branch: "master", deployedAt: "2026-08-22T00:00:00Z" }),
    );

    expect(readReleaseMarker(dir)).toEqual({ version: "2.19.0", commit: "a41c9e2" });
  });

  it("returns null when the file does not exist", () => {
    expect(readReleaseMarker(dir)).toBeNull();
  });

  it("returns null when the file is not valid JSON", () => {
    writeFileSync(join(dir, "release.json"), "not json {");

    expect(readReleaseMarker(dir)).toBeNull();
  });

  it("returns null when version or commit is missing or empty", () => {
    writeFileSync(join(dir, "release.json"), JSON.stringify({ version: "2.19.0" }));
    expect(readReleaseMarker(dir)).toBeNull();

    writeFileSync(join(dir, "release.json"), JSON.stringify({ version: "", commit: "a41c9e2" }));
    expect(readReleaseMarker(dir)).toBeNull();

    writeFileSync(join(dir, "release.json"), JSON.stringify({ version: 2, commit: "a41c9e2" }));
    expect(readReleaseMarker(dir)).toBeNull();
  });
});
