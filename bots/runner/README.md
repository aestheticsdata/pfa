# bot-runner — synthetic users

Bots that use an app over HTTP like real people — sign up, sign in, enter spendings, attach a
receipt now and then, browse the dashboard and the statistics — to grow a realistic dataset and see
how the server, nginx, Redis sessions and MySQL behave under real use (epic PFA-120).

The bots go through the app's **public URL**: nginx, sessions, CSRF, the API's validation, exactly
like a browser. Nothing here touches the database directly.

```
src/
  core/        generic engine — knows nothing about PFA (a test enforces it)
    engine/      the Runner: scheduling, visits, switches, counters
    registry/    auto-discovery of actions
    http/        per-bot HTTP session: cookie jar, CSRF header, RPS cap
    limits/      hard caps: RPS token bucket, rolling upload budget
    control/     control API (127.0.0.1 + bearer token)
    storage/     state files (0600): bots' passwords, switches, upload ledger
  apps/pfa/    PFA's adapter — the only PFA-specific code
    pfaApp.ts    URL, synthetic domain, bots, sign-in
    persona/     the four daily bots, their catalogs, guardrails
    actions/     what a bot can do — one file per action
    api/         typed client of the PFA routes (payloads typed by the API's own DTOs)
    receipts/    the ten fixed receipt pictures
  cli/         dev tools
```

## Run it

Node 22+. `pnpm install`, then copy `.env.example` to `.env` (or export the variables).

```bash
pnpm test        # unit tests: guards, caps, registry, engine, control API
pnpm typecheck
pnpm lint
pnpm start       # the runner + its control API on 127.0.0.1:7300
pnpm bot:once -- saturnus 5   # dev: one visit of one bot, now, 5 actions
```

Locally, start PFA's API with `SYNTHETIC_ALLOWED_IPS=127.0.0.1,::1`, or every bot is refused
(PFA-122 locks bot accounts to the runner's address).

## The bots

Four permanent "daily" bots, `saturnus`, `ceres`, `janus` and `minerva` `@synthetic.test`, each with
its own habits (`apps/pfa/persona/bots.ts`). They visit about 2–3 times a day at random between
07:00 and 23:00 **Paris time** (ks-b runs on UTC; the app's zone is read through `Intl`, so the
change to winter time needs nothing), do 1–5 things per visit, and pause between actions like
someone reading.

## Load bots (PFA-128)

Up to 500 more, `legionary-001` … `legionary-500@synthetic.test`, each borrowing the habits of one
of the daily bots. **Always the same accounts**: created on their first visit, kept from one run to
the next, so their data grows over months like real users' (`synthetic:purge` is for exceptional
clean-ups only). The two populations are independent: nothing below ever touches the daily bots.

- **Target** (0–500, any number): the runner brings load bots up on its own — `step` more every
  `everySec` seconds (the ramp), first visit within minutes, spread out — and stops the excess at
  once when the target drops (highest first, so the same bots stay up).
- **"Load bots" switch**: off stops every load bot at once and keeps the target; on ramps back to
  it. Off on a fresh install. The daily bots have their own switch ("Daily bots"); either one runs
  without the other.
- **A bot's own switch**: off sets that bot aside. A load bot turned off takes no place in the
  target — the ramp brings up the next one. Flipping "Daily bots" or "Load bots" either way sets
  every bot of that kind to follow it; a bot turned on while its kind is off turns the kind on, alone.
- **Pace**: `daily` (like real users: 2–3 visits a day in waking hours, at most one spending a visit — 1–2 a day — at hours that change every day) or `burst` (a stress test:
  a visit every 1–5 min, day and night, 1–5 s between actions).
- **Backpressure**: at most 50 visits at once, every bot together; a bot whose time comes while the
  pool is full goes at the next tick. With the global RPS cap (40 req/s), the generator never falls
  over before the server it is measuring.

Target, switch, pace and ramp are persisted; which bots are up is not — after a restart the ramp
starts again from zero.

### Running a load test

1. Check the disk first: PFA's API and the runner log every request, and PM2's logs on ks-b must
   rotate (`du -sh ~/.pm2/logs`).
2. Back-office → Overview: set the ramp (e.g. +10 every 30 s), the target (start low: 50, then 120,
   250, 500), the pace (`burst` to stress, `daily` for realistic growth), then switch load bots on.
3. Watch the back-office (actions/min, rps and `throttled`, error rate, p50/p95, 2xx/4xx/5xx per
   second) next to the server: Iknos and Zeus for CPU, RAM, MySQL and the PFA API's own latencies,
   nginx's access log for its rate limits.
   ⚠️ Every bot comes from ks-b's address, and PFA's `/api/` allows **5 req/s per address** (burst
   20, `api_zone` in nginx.conf) and 20 connections: above that nginx answers **503** before PFA
   sees the request. Those 503s are nginx's protection doing its job, not PFA failing — and as long
   as the limit applies to ks-b, the bots as a whole cannot push PFA past ~5 req/s.
4. Stop: the "Load bots" switch (daily bots keep going); the "Daily bots" switch for the others.


**Quiet hours**: no new spending between 22:00 and 10:00 Paris time by default — actions flagged
`pausedInQuietHours` are skipped in the window, browsing goes on. The window is changed from the
back-office (`PUT /quiet-hours`) and persisted.

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
| Off by default; the "Daily bots" and "Load bots" switches are persisted and hold mid-visit | `Runner.setDailyEnabled/setLoadEnabled`, `<app>-state.json` |
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
| `GET /status` | running, live bots, target and ramp, actions/errors/requests per minute, rps, throttled, limits, upload budget, quiet hours |
| `GET /history` | the last 80 s in 1-second slices: actions, errors, p50/p95, 2xx/4xx/5xx, live/target |
| `GET /history/day` | the last 24 h in 15-minute slices, same fields + actions by name, errors by action, actions by bot (saved in `<app>-activity.json`, kept across restarts) |
| `PUT /daily` `{"enabled"}` · `PUT /load` `{"enabled"}` · `PUT /load-pace` `{"pace"}` | the two switches, the load pace |
| `PUT /target` `{"target": n}` · `PUT /ramp` `{"step", "everySec"}` | load-bot target (capped) and ramp |
| `GET/PUT /quiet-hours` `{"from": "22:00", "to": "10:00"}` | the quiet window, on the app's clock |
| `GET /bots` · `GET /bots/:id` · `PATCH /bots/:id` `{"enabled"}` · `POST /bots/bulk` `{"ids", "enabled"}` | bots, a bot's detail, toggles |
| `POST /bots/:id/restart-session` | forget a bot's session |
| `POST /accounts/:id/disable` · `DELETE /accounts/:id` | close a bot's account in the app (then the bot is blocked for good) |
| `GET /actions` · `PATCH /actions/:name` `{"enabled"}` · `POST /actions/enable-all` | per-action toggles |
| `GET /limits` · `GET /upload-budget` | read-only caps |

The back-office (`bots/nest-api`, PFA-127) is a client of this API. Closing an account goes through
PFA's internal route (`PFA_INTERNAL_API_URL` + `SYNTHETIC_ADMIN_TOKEN`, loopback only).

## Clean up

Bot data is meant to stay (months of history). To wipe it anyway: `pnpm synthetic:purge` in
`nest-api/` (see `nest-api/docs/synthetic-users.md`).
