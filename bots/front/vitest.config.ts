import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@lib": at("./src/lib"),
      "@components": at("./src/components"),
      "@text": at("./src/text"),
      "@contracts": at("../nest-api/src/contracts"),
    },
  },
  test: { include: ["src/**/*.spec.ts"], environment: "node" },
});
