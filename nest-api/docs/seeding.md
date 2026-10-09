# Seeding guide — `scripts/seed.ts`

Mock-data seeder for the local demo account **`local.dev@mock.io`**. It generates a
coherent city life on ~3500 €/month: monthly budgets, ~12 recurring charges,
14 categories, thousands of realistic variable spendings, and a few one-off
exceptionals.

Spendings follow a week's rhythm (`WEEK_RHYTHM`): Monday to Thursday stay in,
Friday goes out, Saturday is the big day, Sunday a lighter one — the pattern the
statistics page's weekday chart reads, green on the quiet days and over the
weekly ceiling's daily share at the weekend. A day with nothing else still gets
one small spending: a coffee, a ticket, a few groceries.

Everything it writes is **in English** — shops, categories, charges, exceptionals —
because the demo film and the stills made from this account go on an English
portfolio page. Until 2026-09-29 it wrote them in French: an account seeded
before then is rebuilt in English by a `--wipe` (below).

It is meant to be run **repeatedly** to keep the account topped up to today.

## Command

```bash
pnpm seed -- --from <YYYY-MM-DD> [--to <YYYY-MM-DD>] [--wipe]
pnpm seed -- --top-up [--to <YYYY-MM-DD>]
pnpm seed -- --add-groups [--from <YYYY-MM-DD>] [--to <YYYY-MM-DD>]
```

> The `--` is required so pnpm forwards the flags to the script.

| Option   | Required | Description                                                        |
| -------- | -------- | ------------------------------------------------------------------ |
| `--from` | **yes**, unless `--top-up` | Start date, inclusive (`YYYY-MM-DD`). |
| `--to`   | no       | End date, inclusive. Defaults to **today**.                        |
| `--wipe` | no       | Destructive rebuild — see below. Omit it for safe append mode.     |
| `--top-up` | no     | Start the day after the account's last spending — see below.       |
| `--add-groups` | no | Add groups and shared receipts to the spendings already there — see below. |

Bad or missing arguments print the usage and exit without touching the database.

## Two modes

### Append (default — nothing is deleted)

The common case. For every month in `[from, to]` the script:

- creates the **budget/dashboard** only if that month has none (otherwise it
  reuses the stored budget);
- creates the month's **recurrings** only if that month has none;
- **always adds spendings** for every day in the range — including days that
  already have spendings — and guarantees each day gets at least one. It never
  deletes anything.

Because spendings are always added, **re-running the same range piles on more
spendings** — this is intentional, to keep the tool simple. Budgets and
recurrings are *not* duplicated, so the monthly budget and recurring totals stay
correct however many times you run it. It is safe even if you've entered real
data on the account through the app.

Day-level endpoints are honored: `--from 2026-07-09 --to 2026-07-16` adds
spendings for the 9th through the 16th.

### `--wipe` (destructive rebuild)

Deletes **all** of the account's seeded rows first
(spendings / recurrings / dashboards / categories, plus the exceptionals this
script seeds — matched by label, including the French labels it seeded until
2026-09-29), **then** regenerates the whole range from scratch. The two
pre-existing *real* exceptionals are preserved.

⚠️ `--wipe` clears the **entire** account dataset, not just the range. If you
pass a narrow range with `--wipe`, the account ends up holding only that range.

## Groups and shared receipts

Every seeding run (`--from`, `--top-up`, `--wipe`) then passes over the spendings
it just generated (`scripts/seed-groups.ts`) and, without adding any money:

- **groups** (PFA-189): on some days, 2–4 of the day's spendings whose
  categories fit a store run — *City Supermarket*, *Department Store*,
  *Pharmacy*, *Sports Store*, *Amazon* — become one group, labelled
  `<store> — <detail>`. Most groups get a receipt;
- **shared receipts**: on some other days, two plain spendings get one receipt.

Monthly totals are exactly the same as without the pass. The pass is seeded
with a fixed value, so it is reproducible for the same spendings.

Receipts are real JPEG files, drawn as a paper receipt (store, date, lines,
total) by `scripts/seed-receipts.ts` into the account's invoices folder
(`PFA_INVOICES_IMAGES_PATH`, else `nest-api/invoicesUpload/`), named
`seed-receipt-<hex>-r.jpg`. They are local only: the seeder does not copy them
to the backup server.

### `--add-groups` (decorate what is already there)

For an account seeded before the pass existed. No spending is added: the pass
runs on the spendings the account already holds — the whole history, or the
`--from`/`--to` window. It only touches plain rows (no group, no receipt) on
days that hold no group or receipt yet, so running it twice does not stack a
second group on a day. Not combinable with `--wipe` or `--top-up`.

```bash
pnpm seed -- --add-groups
```

`--wipe` also deletes the receipt files this seeder drew — only the
`seed-receipt-*` ones, never a receipt uploaded through the app.

## Examples

```bash
# Add spendings from a start date up to today
pnpm seed -- --from 2026-07-09

# Full rebuild from the beginning up to today
pnpm seed -- --wipe --from 2023-01-01

# Backfill a specific past window, non-destructive
pnpm seed -- --from 2025-01-01 --to 2025-03-31
```

## Typical workflow

Run this whenever you want to add data up to today:

```bash
pnpm seed -- --top-up
```

`--top-up` asks the database for the account's last spending day and appends
from the day after, up to today (or `--to`). Two weeks or six months since the
last run, the gap is filled; already up to date, it says so and adds nothing —
so it is safe to run as often as you like. The demo harness runs it before
every take (`front/e2e/demo/demo.setup.ts`). It cannot be combined with
`--from` or `--wipe`, and refuses an account with no spending at all: seed that
one in full first.

The date it works out is the one you would otherwise pick by hand. Existing days
are **not** skipped in append mode, so a manual `--from` has to be exactly the
day after the account's last one:

```sql
SELECT MAX(date) FROM Spendings
 WHERE userID = (SELECT ID FROM Users WHERE email = 'local.dev@mock.io');
```

A `--from` earlier than that doubles up the overlapping days; a `--from` later
leaves a hole. Neither is detected by the script — which is what `--top-up` is
for.

## Notes

- **Account guard.** The script looks the account up by email and refuses to run
  if `local.dev@mock.io` does not exist in the database `DATABASE_URL` points at.
  It creates neither the user nor anything else outside that user's rows — sign
  the account up once through the front's `/signup` before the first run. The id
  is resolved at runtime, so the script is not tied to one machine's database.
- **Reproducibility.** The PRNG is seeded **per-month**, so a `--wipe` rebuild of
  the same range is deterministic. Append runs add fresh spendings each time, so
  they are not meant to be reproducible.
- **Currency** is EUR; amounts are clamped to the DB column precision.
- **Prerequisites.** A reachable MariaDB via `DATABASE_URL` in `nest-api/.env`,
  and the generated Prisma client (`pnpm prisma generate`, also run by
  `prebuild`). Use the project's Node version (≥ 22) when running pnpm.
