import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const generated = fileURLToPath(new URL("./generated/prisma", import.meta.url));

/**
 * SWC, not esbuild: Nest's DI reads constructor types from `emitDecoratorMetadata`, which esbuild
 * does not emit. The two aliases mirror package.json `imports`, pointed at the sources.
 */
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  resolve: {
    alias: [
      { find: /^#app\/(.*)\.js$/, replacement: `${src}/$1.ts` },
      { find: /^#prisma-client\/(.*)\.js$/, replacement: `${generated}/$1.ts` },
    ],
  },
  test: {
    globals: true,
    include: ["src/**/*.spec.ts"],
    environment: "node",
  },
});
