# bots — synthetic users (epic PFA-120)

Bots that use PFA like real people, and the back-office that drives them.

```
bots/
  runner/      the bot engine (PFA-124): generic core + PFA adapter, control API on 127.0.0.1:7201
  nest-api/    back-office API (PFA-127): auth, apps, runner proxy, incidents, push — 127.0.0.1:7200
  front/       back-office front (PFA-127): Next 16.4 — 127.0.0.1:3014, the only part nginx routes
  deploy/nginx/ the bots.1991computer.com vhost
```

Only the front is public (`bots.1991computer.com`). Its server talks to the API, the API to the
runner — both on loopback, both token- or session-guarded. The browser never sees either.

## Run it locally (mock mode)

The back-office runs without runner nor PFA: `BOTS_MODE=mock` serves PFA on a simulated runner
(deterministic, seed 1991 — the same at every take of a film) plus an empty second app.

```bash
# MySQL and Redis running locally; Node 24 for nest-api and front
cd bots/nest-api && pnpm install && pnpm db:migrate && pnpm dev    # .env: see below
cd bots/front && pnpm install && pnpm dev                                    # http://localhost:3014
```

`bots/nest-api/.env` (gitignored): `DATABASE_URL` (a `bots` database), `SESSION_SECRET` (32+ chars),
`BOTS_MODE=mock`, optional `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` for push. The first visit goes to
`/setup` (one account, sealed afterwards). Live mode instead reads `BOTS_APPS_FILE`
(`nest-api/config/apps.example.json`) and each runner's token from the environment.

## The back-office

- **Auth** — Zeus's model: one sealed account, bcrypt, recovery passphrase, rate limits, CSRF, audit.
- **Apps** — picked after sign-in (skipped with one app). Each app has its theme (`.theme-pfa`
  mapped onto the semantic tokens, `front/src/styles/tokens/themes.css`), logo, runner.
- **Controls** — kill switch, load target and ramp (load bots: PFA-128), quiet hours, bot and action
  toggles, bulk on/off, restart a session, disable / purge an account.
- **Incidents** — `synthetic-foreign-ip` lines read from the app's PM2 logs (`alertLogs` in
  apps.json), grouped by account + IP, danger banner on every page, Web Push to subscribed devices.
- **Live** — every page re-reads its data every 2 s (`router.refresh()`); blocks of data sit in
  Next 16.3 `catchError` boundaries; drawer and modal are parallel + intercepted routes.

## Deploy (ks-b)

One script per part, same shape as pfa's, folio's and Zeus's (release folder, switch with backup,
pm2 reload, automatic rollback, changelog, report to Zeus as app `bots`). Each refuses to run unless
the tree is clean and `HEAD` is `origin/master`.

```bash
nest-api/deploy-api.sh       # builds on ks-b, then prisma migrate deploy, then reload
front/deploy-front.sh        # builds on ks-b with the API contracts beside it
runner/deploy-runner.sh      # no build (tsx); state stays in /var/www/bots/state
<script> rollback            # the previous release, kept as a backup
```

Needs, on this machine (all gitignored): `nest-api/ecosystem.config.cjs` and
`runner/ecosystem.config.cjs` (from their `ecosystem.config.example.cjs`), and
`nest-api/config/apps.json` (from `apps.example.json`). The front's `ecosystem.config.cjs` holds no
secret and is committed. Deploy the API before the runner (the API's database and the runner's
token pair), the front last.

On ks-b, `/var/www/bots` holds `nest-api/`, `runner/`, `public_html/` (the front), `state/`,
`deploy-logs/`, `ecosystem.config.cjs`, `runner.ecosystem.config.cjs` and `apps.json`. First install,
once: the `bots` database and user, the certificate and the vhost (`deploy/nginx/bots.conf`),
`SYNTHETIC_ADMIN_TOKEN` in PFA's own env, and the `bots` row in Zeus's registry.
