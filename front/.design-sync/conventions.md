## Building with pfa

pfa is a personal-finance app: **dark-only**, French UI, dense numeric screens (budgets, spendings, categories, statistics).

### Setup — there is nothing to wrap

No provider is required. The tokens are plain CSS custom properties on `:root` in `styles.css`, and **dark is the default** — do *not* add a `dark` class or a theme provider. `Tooltip` mounts its own `TooltipProvider`. The only global is `<Toaster />` (sonner), mounted once near the root, and only if you raise toasts.

### The styling idiom: Tailwind v4 utilities over pfa tokens

CSS-first Tailwind — there is no `tailwind.config.js`; the theme lives in CSS via `@theme`. Style with utilities built on the pfa palette.

**Never** use a raw value (`text-[13px]`, `bg-[#121212]`, `rounded-[6px]`) or a stock Tailwind palette colour (`gray-400`, `cyan-500`). Every one has a canonical token below, and the app source contains zero raw palette colours.

| Family | Names | Meaning |
|---|---|---|
| Ink (text) | `ink` `ink-2` `ink-3` `ink-4` `ink-5` | primary → progressively muted |
| Surface | `background` `surface-elev` `surface-hi` `surface-hover` | page → card → field/track → hover |
| Line | `line` `line-soft` | borders → discreet separators |
| Accent | `accent-strong` `accent-d` `accent-bg` | mint green: positive, primary action |
| Semantic | `neg` `exc` `elec` | over-budget red · exceptional-purchase blue · "today" marker |
| Danger | `danger-solid` `on-danger` `danger-surface` `danger-border-soft` | delete affordances |

Compose them with the property that fits the family — ink drives text, surfaces drive fills, lines drive borders, and the accent/semantic families drive any of the three: `text-ink-3`, `bg-surface-elev`, `border-line`, `text-neg`, `bg-exc-bg`, `ring-elec`, `from-accent-d`. (`background` is the page fill: `bg-background`.)

**Type:** `text-3xs` `text-2xs` (11px micro-label) … `text-display` `text-display-lg` (hero numbers). `tracking-snug` for titles, `tracking-caps` for uppercase micro-labels. `font-sans` = Geist, `font-mono` = Geist Mono. Spacing stays on the numbered scale (`p-4`, `gap-6`, `px-5.5`).

**Every meaningful number carries `.num`** (Geist Mono + tabular figures): amounts, percentages, dates, counters. For currency prefer the `MoneyAmount` component over hand-formatting — but note `MoneyAmount` does **not** apply `num` itself (`StatTile` adds it on its value line), so a standalone one needs `className="num …"`.

Do not write `dark:` variants. The system is dark-only: the palette above is already the dark palette, and a `dark:` prefix buys nothing.

### Where the truth lives

- `styles.css` and its `@import` closure — the real token values. Read them before inventing anything.
- `guidelines/docs/design-system.md` — the authoritative write-up: ground rules, every scale, the component catalogue, and the accepted exceptions. Read this first.
- Each component's `.prompt.md` / `.d.ts` — its actual props.

### Composition rules that matter

- **Cards are `GlowCard`.** Never hand-roll the gradient border; it is the app's signature surface. `hover` adds the lift used by category tiles.
- Card headings go through `CardSectionHeader` (title + muted `meta` or an `action` control), or `CardTitle` when the header layout is bespoke.
- `StatTile` for label/value/caption stats, `MeterBar` for progress bars, `FilterChip` for filter pills, `Overline` for uppercase section labels, `EmptyState` for empty lists.

```jsx
<GlowCard as="section" className="p-5">
  <CardSectionHeader title="Dépenses fixes" meta="12 prélèvements" />
  <div className="mt-4 grid grid-cols-3 gap-4">
    <StatTile label="Total du mois" value={<MoneyAmount value={1240.5} unit="€" />} sub="sur 12 prélèvements" />
  </div>
  <MeterBar value={72} height={6} className="mt-4" />
  <p className="mt-2 text-2xs tracking-caps text-ink-4">RESTE À VIVRE</p>
  <Button variant="primary" size="sm" className="mt-4">Ajouter</Button>
</GlowCard>
```
