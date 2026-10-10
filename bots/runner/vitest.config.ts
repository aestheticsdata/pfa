import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const abs = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror the tsconfig `paths` aliases: no relative imports, in tests either.
    alias: {
      "@core": abs("./src/core"),
      "@apps": abs("./src/apps"),
      "@cli": abs("./src/cli"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
