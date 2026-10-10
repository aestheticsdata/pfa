import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("..", import.meta.url));

async function sources(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => join(entry.parentPath, entry.name));
}

describe("code conventions", () => {
  it("imports through path aliases only, never relative paths", async () => {
    for (const file of await sources(SRC)) {
      const text = await readFile(file, "utf8");
      expect(text, relative(SRC, file)).not.toMatch(/from "\.\.?\//);
    }
  });

  it("exports types only from interfaces/ folders", async () => {
    for (const file of await sources(SRC)) {
      if (file.includes("/interfaces/")) continue;
      const text = await readFile(file, "utf8");
      expect(text, relative(SRC, file)).not.toMatch(/^export (type|interface) /m);
    }
  });

  it("keeps the core generic: it never imports an app", async () => {
    for (const file of await sources(join(SRC, "core"))) {
      const text = await readFile(file, "utf8");
      if (file.endsWith("actionRegistry.spec.ts")) continue;
      expect(text, relative(SRC, file)).not.toMatch(/from "@(apps|pfa-api)\//);
    }
  });
});
