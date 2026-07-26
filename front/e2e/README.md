# E2E (Playwright)

## Prerequisites

1. MySQL and Redis running (same as the regular dev setup).
2. Seed account present: `pnpm --dir ../nest-api seed` (creates `abc@abc.com` with demo data).
3. `cp .env.test.local.example .env.test.local` and fill in `E2E_PASSWORD` (git-ignored, never committed).

## Running

```bash
pnpm test:e2e      # headless
pnpm test:e2e:ui   # Playwright UI mode
```

If the front (:3000) and the API (:6100) are already running in your terminals, Playwright
reuses them (`reuseExistingServer: true`). Otherwise it starts both itself.

## Structure

- `auth.setup.ts` — logs in once through the real login form, saves the session to `.auth/user.json`
  (git-ignored). Doubles as the login E2E test. Also pins the account language to French, since
  every locator below asserts French copy and the persisted language wins over the browser locale.
- `helpers/` — shared test utilities (API base + CSRF token, week length). Not collected as tests.
- `public.spec.ts` — unauthenticated smoke: login and signup forms render.
- `smoke.spec.ts` — every private page loads and shows its data (not the error boundary,
  not a stuck skeleton). The regression net for the TanStack Query migration (COS-52).
- `create-spending.spec.ts` — create a spending through the modal, see it appear, delete it,
  see it disappear. Self-cleaning: an `afterEach` sweep removes any leftover `E2E …`-labelled
  spendings via the API even when the test fails midway.
