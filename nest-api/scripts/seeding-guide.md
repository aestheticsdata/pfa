# Seeding guide — `scripts/seed.ts`

Mock-data seeder for the local demo account **`abc@abc.com`**. It generates a
coherent "Paris life on ~3500 €/month" dataset: monthly budgets, ~12 recurring
charges, 14 categories, thousands of realistic variable spendings, and a few
one-off exceptionals.

It is meant to be run **repeatedly** to keep the account topped up to today.

## Command

```bash
pnpm seed -- --from <YYYY-MM-DD> [--to <YYYY-MM-DD>] [--wipe]
```

> The `--` is required so pnpm forwards the flags to the script.

| Option   | Required | Description                                                        |
| -------- | -------- | ------------------------------------------------------------------ |
| `--from` | **yes**  | Start date, inclusive (`YYYY-MM-DD`).                              |
| `--to`   | no       | End date, inclusive. Defaults to **today**.                        |
| `--wipe` | no       | Destructive rebuild — see below. Omit it for safe append mode.     |

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
script seeds — matched by label), **then** regenerates the whole range from
scratch. The two pre-existing *real* exceptionals are preserved.

⚠️ `--wipe` clears the **entire** account dataset, not just the range. If you
pass a narrow range with `--wipe`, the account ends up holding only that range.

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
pnpm seed -- --from <start-date>
```

Every day from `--from` to today gets spendings added. Existing days are **not**
skipped, so pick `--from` as the first day you actually want to add — a `--from`
that overlaps existing data stacks extra spendings on those days.

## Notes

- **Account guard.** The script refuses to run unless `abc@abc.com` resolves to
  the expected user id.
- **Reproducibility.** The PRNG is seeded **per-month**, so a `--wipe` rebuild of
  the same range is deterministic. Append runs add fresh spendings each time, so
  they are not meant to be reproducible.
- **Currency** is EUR; amounts are clamped to the DB column precision.
- **Prerequisites.** A reachable MariaDB via `DATABASE_URL` in `nest-api/.env`,
  and the generated Prisma client (`pnpm prisma generate`, also run by
  `prebuild`). Use the project's Node version (≥ 22) when running pnpm.
