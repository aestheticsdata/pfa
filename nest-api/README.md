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
