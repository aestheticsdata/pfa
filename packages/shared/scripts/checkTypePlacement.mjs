#!/usr/bin/env node
// House rule (PFA-246): an exported type or interface lives in an `interfaces/` folder beside the
// code that owns it, never in a component, hook or module. The one exception is a zod schema file
// (`src/schemas/**`, `**/schema.ts`), whose `export type X = z.infer<…>` stays next to its schema.
// Re-exports (`export type { X } from …`) are not declarations and pass. Exits 1 on any breach.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const DECLARATION = /^export (?:declare )?(?:type|interface) \w+/gm;

const isExempt = (path) =>
  path.split(sep).includes("interfaces") ||
  path.startsWith(`schemas${sep}`) ||
  path.endsWith(`${sep}schema.ts`) ||
  path.includes(`${sep}__tests__${sep}`) ||
  path.endsWith(".d.ts");

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(name) ? [full] : [];
  });

const breaches = walk(ROOT).flatMap((file) => {
  const path = relative(ROOT, file);
  if (isExempt(path)) return [];
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(DECLARATION)].map((match) => {
    const line = source.slice(0, match.index).split("\n").length;
    return `src/${path}:${line}  ${match[0]}`;
  });
});

if (breaches.length > 0) {
  console.error("Exported types must live in an interfaces/ folder (PFA-246):");
  for (const breach of breaches) console.error(`  ${breach}`);
  process.exit(1);
}
