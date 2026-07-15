// Pre-converter build step for design-sync. Run from front/ before package-build.mjs:
//
//   node .design-sync/prepare.mjs
//
// pfa is a Next app, not a published component library, so the converter's two
// normal inputs — a compiled stylesheet and a shipped .d.ts tree — don't exist.
// This produces both from the app's own source. Nothing here is app code; all
// output is gitignored and regenerated every sync.
//
//  1. TYPES. tsc emits declarations for the DS barrel into front/dist/types.
//     design-sync's findTypesRoot() probes `dist/types` under the package, and
//     loadDts() then walks up to the nearest package.json *with a name* and
//     reads its `types` field — so we drop a tiny manifest there pointing at the
//     barrel's .d.ts. Without it the entry .d.ts is never loaded, the call-
//     signature fallback finds nothing, and all 99 <Name>Props degrade to
//     `[key: string]: unknown` — i.e. the design agent gets no API contract.
//
//  2. STYLES. styles/globals.css is Tailwind v4 source (@import 'tailwindcss',
//     @theme, @custom-variant), which is not CSS. Compile it with the same
//     PostCSS plugin Next uses. Then widen `.dark` to also match :root — pfa is
//     dark-only and src/app/layout.tsx sets `dark` on <html>, but preview cards
//     and designs built in Claude Design have no app shell, so without this
//     every token silently falls back to the light shadcn defaults.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

// ── 1. types ─────────────────────────────────────────────────────────────
execFileSync('./node_modules/.bin/tsc', ['-p', '.design-sync/tsconfig.dts.json'], { stdio: 'inherit' });
writeFileSync(
  'dist/types/package.json',
  `${JSON.stringify({ name: 'pfa-ds-types', types: './.design-sync/ds-entry.d.ts' }, null, 2)}\n`,
);
console.error('[PFA_TYPES] dist/types + manifest written');

// ── 2. styles ────────────────────────────────────────────────────────────
const SRC = '.design-sync/ds-styles.src.css';
const OUT = '.design-sync/.cache/pfa-styles.css';
const res = await postcss([tailwind()]).process(readFileSync(SRC, 'utf8'), { from: SRC, to: OUT });

// `.dark { --bg: … }` → `:root, .dark { … }`. Same specificity as the light
// :root block above it, and later in source order, so it wins.
const css = res.css.replace(/(^|\})(\s*)\.dark(\s*\{)/g, '$1$2:root, .dark$3');
const widened = (css.match(/:root, \.dark\s*\{/g) ?? []).length;
if (!widened) {
  console.error('[PFA_CSS] no .dark block found — tokens would not apply to previews. Aborting.');
  process.exit(1);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, css);
console.error(`[PFA_CSS] ${OUT}: ${(css.length / 1024).toFixed(0)} KB, ${widened} .dark block(s) widened to :root`);
