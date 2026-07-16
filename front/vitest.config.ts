import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const abs = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror the tsconfig `paths` aliases so tests can import via @components/*,
    // @src/*, … just like the app code (no relative imports).
    alias: {
      "@styles": abs("./styles"),
      "@app": abs("./src/app"),
      "@components": abs("./src/components"),
      "@auth": abs("./src/auth"),
      "@helpers": abs("./src/helpers"),
      "@lib": abs("./src/lib"),
      "@text": abs("./src/text"),
      "@src": abs("./src"),
    },
  },
  test: {
    // `globals: true` lets the existing `describe/it/expect` tests run without
    // importing them; new tests import from "vitest" explicitly.
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}"],
  },
});
