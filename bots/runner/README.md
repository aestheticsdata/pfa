# bot-runner — synthetic users

Bots that use an app over HTTP like real people — sign up, sign in, enter spendings, attach a
receipt now and then, browse the dashboard and the statistics — to grow a realistic dataset and see
how the server, nginx, Redis sessions and MySQL behave under real use (epic PFA-120).

The bots go through the app's **public URL**: nginx, sessions, CSRF, the API's validation, exactly
like a browser. Nothing here touches the database directly.

```
src/
  core/        generic engine — knows nothing about PFA (a test enforces it)
    engine/      the Runner: scheduling, visits, kill switch, counters
    registry/    auto-discovery of actions
    http/        per-bot HTTP session: cookie jar, CSRF header, RPS cap
    limits/      hard caps: RPS token bucket, rolling upload budget
    control/     control API (127.0.0.1 + bearer token)
    storage/     state files (0600): bots' passwords, kill switch, upload ledger
  apps/pfa/    PFA's adapter — the only PFA-specific code
    pfaApp.ts    URL, synthetic domain, bots, sign-in
    persona/     the four daily bots, their catalogs, guardrails
    actions/     what a bot can do — one file per action
    api/         typed client of the PFA routes (payloads typed by the API's own DTOs)
    receipts/    the ten fixed receipt pictures
  cli/         dev tools
```

## Run it

Node 22. `pnpm install`, then copy `.env.example` to `.env` (or export the variables).

```bash
pnpm test        # unit tests: guards, caps, registry, engine, control API
pnpm typecheck
pnpm lint
pnpm start       # the runner + its control API on 127.0.0.1:9471
pnpm bot:once -- saturnus 5   # dev: one visit of one bot, now, 5 actions
```

Locally, start PFA's API with `SYNTHETIC_ALLOWED_IPS=127.0.0.1,::1`, or every bot is refused
(PFA-122 locks bot accounts to the runner's address).

## The bots

Four permanent "daily" bots, `saturnus`, `ceres`, `janus` and `bacchus` `@synthetic.test`, each with
its own habits (`apps/pfa/persona/bots.ts`). They visit about 2–3 times a day at random between
07:00 and 23:00, do 1–5 things per visit, and pause between actions like someone reading. Load bots
(up to 500) come with PFA-128.

Accounts are created on the first visit through PFA's public sign-up — PFA flags them
`isSynthetic` from the domain. Passwords are generated here and stay in the state directory.

## Add an action — the golden rule

**Copy `apps/pfa/actions/_template.ts`, fill in `run()`, it's plugged in.**

Any file of `apps/pfa/actions/` not starting with `_` is an action: the runner discovers it at its
next start. No list to edit, no engine change. The template explains the rules an action must follow
(talk through `ctx.client`, bounded amounts and dates, pooled categories, uploads only from the
fixed set and only after reserving budget).

## Safety — what holds whatever an action does

| Guard | Where |
|---|---|
| Every bot email must be `@synthetic.test`, checked before any HTTP call | `core/guards/syntheticEmail.ts`, `Runner` |
| Off by default; the kill switch is persisted and holds mid-visit | `Runner.start/stop`, `<app>-state.json` |
| Control API: 127.0.0.1 only, bearer token compared in constant time | `core/control/` |
| Hard caps from the environment only — lowered, never raised (500 bots, 40 req/s, 400 MB) | `core/config/runnerConfig.ts` |
| Global RPS cap across every bot | `core/limits/rateLimiter.ts` |
| Uploads: 400 MB per rolling 365 days, every bot together, reserved before upload | `core/limits/uploadBudget.ts` |
| Only the ten fixed pictures can be uploaded, checked byte for byte | `apps/pfa/receipts/receiptImages.ts` |
| Bounded amounts, plausible dates, fixed category pool, bills once a month | `apps/pfa/persona/` |
| A bot PFA refuses (403, wrong password) is blocked, never retried in a loop | `Runner`, `api/pfaApi.ts` |
| Passwords: 256 random bits, 0600 file, never logged | `core/storage/botSecrets.ts` |

## Receipts and disk

Each daily bot keeps receipts at its own pace (0.5 to 3.5 a week, about 2 on average). The ten
pictures are receipts of invented shops, each with its own fonts, items and total
(`scripts/generateReceipts.mjs` regenerates them). They weigh ≤ 5.8 KB, ≤ 6.4 KB once PFA has
re-encoded them; the budget charges 7 KB per upload, so it counts PFA's disk with margin. When the
budget is spent, `receipt.upload` is simply skipped.

## Control API

`Authorization: Bearer $RUNNER_CONTROL_TOKEN`, on 127.0.0.1 only (from elsewhere: an SSH tunnel).

| Route | |
|---|---|
| `GET /status` | running, bots by state, actions/errors/requests per minute, limits, upload budget |
| `POST /runner` `{"running": true\|false}` | kill switch |
| `GET /bots` · `PATCH /bots/:id` `{"enabled": bool}` | per-bot toggle |
| `GET /actions` · `PATCH /actions/:name` `{"enabled": bool}` | per-action toggle |
| `GET /limits` · `GET /upload-budget` | read-only caps |

The back-office (PFA-127) is a client of this API.

## Clean up

Bot data is meant to stay (months of history). To wipe it anyway: `pnpm synthetic:purge` in
`nest-api/` (see `nest-api/docs/synthetic-users.md`).
