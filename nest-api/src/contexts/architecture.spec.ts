import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Architecture fitness tests (PFA-297): the dependency rule of docs/ddd-hexagonal.md, checked on
 * every import under `src/contexts/` by `pnpm test` — so by the deploy's fast checks too. A
 * violation names the file and the import; fixing it is a design decision, not a lint tweak.
 */

const CONTEXTS_ROOT = __dirname;
const LAYERS = ["domain", "application", "infrastructure", "interface"] as const;
type Layer = (typeof LAYERS)[number] | "root";

interface SourceFile {
  path: string;
  context: string;
  layer: Layer;
  imports: string[];
}

interface Violation {
  file: string;
  specifier: string;
}

/** Infrastructure kept out of everything but adapters: persistence, Redis, files, OCR, crypto. */
const ADAPTER_ONLY = [
  /^@db\//,
  /^@generated\//,
  /^@prisma\//,
  /^@redis\//,
  /^sharp$/,
  /^tesseract\.js$/,
  /^node:fs(\/promises)?$/,
  /^ssh2$/,
  /^bcryptjs$/,
];

/**
 * Cross-context imports between adapters that are deliberate, each with its reason. Anything else
 * reaching into another context's infrastructure fails.
 */
const ALLOWED_ADAPTER_IMPORTS: { from: string; to: RegExp; why: string }[] = [
  {
    from: "analytics",
    to: /^@contexts\/spending\/infrastructure\/queries\/search-where$/,
    why: "the search timeline must match exactly what the spending search matches: one where-clause",
  },
];

/** What a context's HTTP edge may take from its own adapters, each with its reason. */
const ALLOWED_EDGE_IMPORTS: { to: RegExp; why: string }[] = [
  {
    to: /\/infrastructure\/queries\//,
    why: "the read side by design (docs §9.4): a screen's controller asks its query class",
  },
  {
    to: /^@contexts\/receipt-reading\/infrastructure\/files\/upload\.config$/,
    why: "multer's disk storage: Nest's FileInterceptor takes its options where the route is declared",
  },
];

const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+"([^"]+)"/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "testing" ? [] : sourceFiles(path);
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts") ? [path] : [];
  });
}

function describeFile(path: string): SourceFile {
  const [context, maybeLayer] = relative(CONTEXTS_ROOT, path).split(sep);
  const layer = (LAYERS as readonly string[]).includes(maybeLayer) ? (maybeLayer as Layer) : "root";
  const imports = [...readFileSync(path, "utf8").matchAll(IMPORT)].map((match) => match[1]);
  return { path: relative(CONTEXTS_ROOT, path), context, layer, imports };
}

/** The context and layer an `@contexts/...` import points at, or null for anything else. */
function target(specifier: string): { context: string; layer: string; rest: string } | null {
  const match = /^@contexts\/([^/]+)\/([^/]+)\/?(.*)$/.exec(specifier);
  return match ? { context: match[1], layer: match[2], rest: match[3] } : null;
}

const files = sourceFiles(CONTEXTS_ROOT)
  .map(describeFile)
  .filter((file) => file.context !== "architecture.spec.ts");

function violations(rule: (file: SourceFile, specifier: string) => boolean): Violation[] {
  return files.flatMap((file) =>
    file.imports.filter((specifier) => rule(file, specifier)).map((specifier) => ({ file: file.path, specifier })),
  );
}

describe("the dependency rule (PFA-297)", () => {
  it("finds the code it checks", () => {
    expect(new Set(files.map((file) => file.context)).size).toBeGreaterThanOrEqual(6);
    expect(files.length).toBeGreaterThan(100);
  });

  it("keeps the domain pure: no framework, no persistence, no outer layer", () => {
    expect(
      violations((file, specifier) => {
        if (file.layer !== "domain") return false;
        const to = target(specifier);
        return (
          /^@nestjs\//.test(specifier) ||
          /^@(infrastructure|monitoring)\//.test(specifier) ||
          ADAPTER_ONLY.some((pattern) => pattern.test(specifier)) ||
          (to !== null && to.layer !== "domain")
        );
      }),
    ).toEqual([]);
  });

  it("keeps persistence, Redis, files and OCR in adapters only", () => {
    expect(
      violations(
        (file, specifier) =>
          file.layer !== "infrastructure" &&
          file.layer !== "root" &&
          ADAPTER_ONLY.some((pattern) => pattern.test(specifier)),
      ),
    ).toEqual([]);
  });

  it("lets the application layer depend on domains only — ports, never adapters", () => {
    expect(
      violations((file, specifier) => {
        if (file.layer !== "application") return false;
        const to = target(specifier);
        if (to === null) return false;
        return (
          to.layer === "infrastructure" ||
          to.layer === "interface" ||
          (to.context !== file.context && to.layer !== "domain")
        );
      }),
    ).toEqual([]);
  });

  it("keeps the HTTP edge off the adapters, and off other contexts' use cases", () => {
    expect(
      violations((file, specifier) => {
        if (file.layer !== "interface") return false;
        const to = target(specifier);
        if (to === null) return false;
        if (to.context !== file.context) return to.layer === "application" || to.layer === "infrastructure";
        return to.layer === "infrastructure" && !ALLOWED_EDGE_IMPORTS.some((allowed) => allowed.to.test(specifier));
      }),
    ).toEqual([]);
  });

  it("crosses into another context only through its domain, its HTTP edge, or an adapter", () => {
    expect(
      violations((file, specifier) => {
        // A module file is its context's composition root: wiring other contexts in is its job.
        if (file.layer === "root") return false;
        const to = target(specifier);
        if (to === null || to.context === file.context || to.layer === "domain") return false;
        // Guards, the user-ID decorator, shared DTOs: the HTTP edges share HTTP things.
        if (to.layer === "interface") return file.layer !== "interface";
        if (to.layer === "application") return file.layer !== "infrastructure";
        return !ALLOWED_ADAPTER_IMPORTS.some((allowed) => allowed.from === file.context && allowed.to.test(specifier));
      }),
    ).toEqual([]);
  });
});
