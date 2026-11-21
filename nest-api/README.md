# PFA Nest API

NestJS API for PFA (Prisma on MySQL, Redis sessions), organised by bounded context.

## Architecture

Domain-Driven Design laid out as a hexagonal architecture (ports & adapters). The full explainer —
why, how, the worked example, the trade-offs — is [docs/ddd-hexagonal.md](docs/ddd-hexagonal.md).

```
src/
├── contexts/          # one folder per bounded context
│   ├── spending/          spendings and groups (core)
│   ├── receipt-reading/   receipt files, OCR, saved lines, bulk read (core)
│   ├── price-comparison/  stores, product types, unit prices (core)
│   ├── budget-planning/   categories, recurrings, exceptionals, the month's budget
│   ├── analytics/         statistics and the dashboard projection (read side only)
│   └── identity/          accounts, sign-in, sessions, bot accounts
├── shared-kernel/     # Money, CalendarDay/Month, AggregateRoot, DomainError, the event port
└── platform/          # config, logging, event bus, monitoring, Prisma, Redis, backups
```

Inside each context, dependencies point inwards:

| Layer | Holds | May import |
| --- | --- | --- |
| `domain/` | aggregates, value objects, rules, ports (abstract classes), events | the shared kernel, other domains |
| `application/` | one use case per user intention | domains and their ports |
| `infrastructure/` | adapters: Prisma repositories, Tesseract, the disk, Redis; `queries/` for reads | anything |
| `interface/` | controllers and DTOs | its context's application (and read queries) |

The rule is enforced by Biome and by `src/contexts/architecture.spec.ts`, which runs with the unit
tests. Where to start reading: `contexts/spending/domain/spending-group.ts` (an aggregate and its
invariants), then `application/merge-spendings-into-group.use-case.ts`, then
`infrastructure/prisma-spending-group.repository.ts` and `spending.module.ts`.

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

Populate the local demo account (`local.dev@mock.io`, the house dev account shared with the other
projects) with realistic mock data over a date range. The seeder does **not** create the account —
sign it up once through the front's `/signup`, then:

```bash
# append data since a given date (up to today), non-destructive
pnpm seed -- --from 2026-07-17

# backfill a specific window
pnpm seed -- --from 2025-01-01 --to 2025-03-31

# full rebuild: wipe this account's seeded rows first, then regenerate
pnpm seed -- --wipe --from 2023-01-01
```

**Why the `--`?** It's the standard npm/pnpm separator: everything before it is for pnpm, everything after it is forwarded verbatim to the `seed` script. Without it, pnpm could try to interpret `--from` as one of its own options instead of passing it through. So `pnpm seed -- --from 2026-07-17` runs the `seed` script and hands it `--from 2026-07-17`.

`--from` is required, `--to` defaults to today, and `--wipe` deletes the account's seeded rows before regenerating. See [`docs/seeding.md`](docs/seeding.md) for the full guide.

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

## Lint and format

Biome, like the front (PFA-262): `pnpm lint` checks, `pnpm lint:fix` fixes, `pnpm format` formats.
`deploy-api.sh` runs `biome ci .` in its gate.

- No ESLint left. typescript-eslint's type-checked set is covered by `tsc` (strict) plus Biome's
  type-aware `noFloatingPromises` / `noMisusedPromises` (nursery). The `no-unsafe-*` family has no
  Biome equivalent; `src` holds no explicit `any`, and strict mode (PFA-261) closes the implicit ones.
- `useImportType` is off: Nest's dependency injection reads constructor parameter types through
  decorator metadata, which an `import type` erases.
- `useMaxParams` (3) is off for controllers, whose decorated handlers take what Nest injects; the one
  injected constructor past three carries a justified `biome-ignore`. CLI scripts may use `console`.

## Production deployment

- `prebuild` runs `prisma generate` automatically before each build
- Ensure `ecosystem.config.js` has `DATABASE_URL` and `JWT_SECRET` for `pfa-nest-api`
- **`DATABASE_URL`** is loaded from `nest-api/.env`
- Deploy via root `./deploy-api.sh` (deploys both Nest and Express)
