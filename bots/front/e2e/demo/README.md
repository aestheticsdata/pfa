# Demo take

One Playwright run that drives the back-office the way a hand would and records it as a single
continuous video, for the landing page's film. Ported from folio's harness (`folio/front/e2e/demo/`),
itself a port of spira's, which documents the recorder, the drawn pointer and the stills in full. The
shared shapes live in `interfaces/demoTypes.ts`, the verbs in `vocabulary.ts`.

```bash
DEMO_CURSOR=off DEMO_FPS=30 pnpm video:generate
```

`DEMO_CURSOR=off` because the landing page's film draws its own pointer. Output lands in
`e2e/demo/out/` (gitignored):

- `bots-demo.mp4`: the take, 1080p, with its chapters written into the file
- `events.json`: every pointer step, press, key and gesture, with the `data-testid` and box of the
  element it was aimed at. The film is edited from it (`landing-page/films/src/films/bots.ts`), by
  those testids, so a re-take keeps the edit.
- `chapters.*`, and `shots/`: the picker, the overview, a slice of the day, the fleet, a bot's drawer,
  the metrics, the action registry, the incidents and the close-account modal — the landing page's
  screenshots, taken after the take, each on a page of its own

## Before a take

1. **The API on the mock, freshly started.** `BOTS_MODE=mock` in `nest-api/.env`, then
   `cd nest-api && pnpm dev`. The simulated runner (seed 1991) and the two open incidents are
   created when the API boots, and the take changes them — a target, eleven bots, an account
   purged — so restart the API before every take.
2. **The front on `localhost:3014`**: `cd front && pnpm dev`. Filmed on the dev server: a
   production build sets its session cookie `secure`, which plain http on a laptop never sends
   back. The setup compiles every route the take visits before it starts, and the fixture paints
   Next's dev badge out.
3. **`front/.env.test.local`** from `.env.test.local.example`: the back-office's one account, on
   the local database. The setup creates it through `/setup` when the database has none, then signs
   in and saves the session (`e2e/.auth/demo.json`), so the film opens on the app picker.
4. **ffmpeg on `PATH`**.

`preflight.ts` names whichever of the first three is missing before a browser is launched.

## The take

Six chapters, about 65 s: the picker and PFA; the overview — the load target raised to 250, Burst
and back, the busiest slice of the day opened; the fleet — the degraded bots, one in its drawer, ten
found by name and turned off at once; the metrics; an action switched off and on; the incidents — a
bot account seen from a foreign IP, purged from the banner.

Which bots are degraded is the simulation's, so the storyboard opens the first one listed and the
film frames it by its drawer, never by its id.
