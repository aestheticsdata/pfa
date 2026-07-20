# PFA Nest API

NestJS API for PFA. Migrated progressively from Express; non-migrated routes are proxied to the legacy API.

## Setup

```bash
pnpm install
pnpm prisma generate
```

## Run

```bash
# development (watch mode)
pnpm run start:dev

# production
pnpm run start:prod
```

## Seed data

Populate the local demo account (`abc@abc.com`) with realistic mock data over a date range:

```bash
# append data since a given date (up to today), non-destructive
pnpm seed -- --from 2026-07-17

# backfill a specific window
pnpm seed -- --from 2025-01-01 --to 2025-03-31

# full rebuild: wipe this account's seeded rows first, then regenerate
pnpm seed -- --wipe --from 2023-01-01
```

**Why the `--`?** It's the standard npm/pnpm separator: everything before it is for pnpm, everything after it is forwarded verbatim to the `seed` script. Without it, pnpm could try to interpret `--from` as one of its own options instead of passing it through. So `pnpm seed -- --from 2026-07-17` runs the `seed` script and hands it `--from 2026-07-17`.

`--from` is required, `--to` defaults to today, and `--wipe` deletes the account's seeded rows before regenerating. See [`scripts/seeding-guide.md`](scripts/seeding-guide.md) for the full guide.

## Tests

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# coverage
pnpm run test:cov
```

### E2E test user

The E2E tests require a dedicated test user in your local database. Create it once (e.g. via the signup flow or directly in the DB):

| Field    | Value                 |
| -------- | --------------------- |
| Email    | `e2e-test@test.com`   |
| Password | `e2e-test-password`   |

**Do not modify or delete this user** — it is used by `test/users.e2e-spec.ts` and `test/spendings.e2e-spec.ts`.

Optional: `E2E_SPENDING_ID_WITH_INVOICE` — ID of a spending with an invoice for the e2e-test user. When set, the GET image test asserts the image case (data URL), otherwise it accepts any 200 response.

## Production deployment

- `prebuild` runs `prisma generate` automatically before each build
- Ensure `ecosystem.config.js` has `DATABASE_URL` and `JWT_SECRET` for `pfa-nest-api`
- **`DATABASE_URL`** is loaded from `nest-api/.env`
- Deploy via root `./deploy-api.sh` (deploys both Nest and Express)
