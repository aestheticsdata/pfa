import { defineConfig } from "vitest/config";

// `#…` imports resolve through package.json `imports`, the same way Metro and Next will resolve
// them: no alias to mirror here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
