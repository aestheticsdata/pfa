# Demo films

One Playwright run that drives the app the way a hand would, records it as a single continuous
video, and writes the chapter list beside it. No editing: the take *is* the video, and the chapter
file is what goes in the description.

```bash
pnpm video:generate
```

Output lands in `e2e/demo/out/` (gitignored):

- `pfa-demo.mp4` — the take, h264, at the exact viewport size, no scaling, with the chapters
  written into the file itself
- `chapters.txt` — `0:00 Title` per line, for a human to read
- `chapters.vtt` — WebVTT, for `<track kind="chapters">` on the portfolio's own `<video>`
- `chapters.ffmeta` — ffmpeg metadata; already applied to the mp4, kept so a re-encode can reapply it
- `chapters.json` — the same marks with millisecond precision
- `shots/01-dashboard.png` and eight more — stills at 3840×2160, for a page that wants pictures too
- `upload/receipt.png` — the receipt chapter 3 attaches, drawn by the storyboard itself

This is a port of Trekker's harness, which is a port of Zeus's, which is a port of Spira's.
`pacing.ts`, `recorder.ts`, `chapters.ts` and `cursor.ts` are byte-identical to Trekker's;
`fixture.ts` is Trekker's plus one method (`Demo.glide`, below); `preflight.ts`, `demo.setup.ts`
and `playwright.demo.config.ts` are the same files with the PFA-specific parts changed. The full
write-up of how it works and why — the CDP screencast, the drawn pointer, the encode, and every
trap found building it — is `front/e2e/demo/HOW-TO-FILM-A-DEMO.md` in the Spira repo, and Zeus's
`e2e/demo/README.md` carries the traps that console found. Only `pfa.demo.ts` knows what PFA is.

## What it needs before it will record

`preflight.ts` refuses to launch a browser until the first three are true, and names whichever one
is not. The rest it cannot check.

1. **The front on `localhost:3000`** — `pnpm dev` does, and that is what the takes so far were
   filmed on: the two things a dev build floats over the page, Next's dev-tools badge (bottom
   left) and the TanStack devtools logo (bottom right), are painted out by `hideDevChrome()` in
   `fixture.ts`, and every screen is visited by the take itself before it matters. The
   production build works too, and is what the other four harnesses film against; it has to
   answer on the same port, because the API's CORS names exactly one origin (`FRONTEND_URL` in
   `nest-api/.env`), so `pnpm dev` must be stopped first:

   ```bash
   cd front && pnpm build
   pnpm exec next start -p 3000
   ```

   A laptop production build could not reach the API before PFA-180: `next.config.js` only let
   the CSP's `connect-src` name `localhost:6100` in development, and `getServerSession` only
   honoured `NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST` there. Both now read the variable in any
   build — it lives in `front/.env.local`, which the deploy never ships, so on ks-b nothing
   changes. Build-time: **rebuild after changing it** — `next start` serves whatever `.next`
   already holds.
2. **The Nest API on `localhost:6100`** — `cd nest-api && pnpm start:dev`. `/api/users/csrf` is
   what preflight probes; its 401 is the answer it wants.
3. **`DEMO_USERNAME` / `DEMO_PASSWORD` in `front/.env.test.local`** — the house dev account,
   `local.dev@mock.io`. Copy `.env.test.local.example` beside it. Never a real credential: the
   video is for a public page, and the take types the password on camera (masked).
4. **ffmpeg on `PATH`** with libx264, the mp4 muxer and the `concat` demuxer — `brew install ffmpeg`,
   or `DEMO_FFMPEG` pointing at one.
5. **The seeded account, topped up to today** — see below.

`settle()` in `fixture.ts` adds one more check on the real page: every stylesheet the document
asked for has loaded and `document.fonts.ready` has resolved before a frame is kept. PFA serves
its three faces through `next/font/google`, so it never fires here; it is kept because the five
harnesses are copies of each other.

## The data, and what it must never contain

The take films the seeder's invented Paris life on `local.dev@mock.io` (`nest-api/docs/seeding.md`):
the house dev account every project here uses, filled by `pnpm seed`, with invented shops, fake
categories, a fake budget. Nothing real is on screen — no real account, no real amount, and the
receipt is a picture the storyboard draws on a blank page before the first frame: an invented
shop, a masked card number, the amount of the row it goes on.

The seeder fills the account **up to today** and the take needs today's card to hold a spending
(the receipt goes on its first row, and the new spending lands there). So before a take:

```bash
cd nest-api && pnpm seed -- --from <the day after the last seeded one>
```

The guide says how to read that date. A `--from` too early stacks duplicates on the overlapping
days; too late leaves a hole the film would show as empty cards.

## The take

Six chapters, **228.4s — three minutes forty-eight**, at the default `DEMO_SPEED=1`.

| | |
|---|---|
| 0:00 Sign in | the login form, the house account typed, the password masked |
| 0:08 Dashboard | the donut's three arcs hovered — fixed, variable, what is left; the month's budget and the weekly ceiling edited inline; a fixed expense added from the card's `+`; the category bar read, the category with the most spendings opened (`data-count` on the rows) and its days read, the modal left by ⎋; the month picker to last month, every widget's entrance replayed and waited out, `Current month` back; the user menu, and the app switched to English — from here on every label is English, and so are the stills |
| 1:21 Spendings | `New spending` from the floating button — label, an amount typed as `9.90+2.50`, a category picked from the combobox by its first letters — landing on today's card; the week picker two months back to the 15th, and `Today` home; the first row of today's card hovered for its actions, a receipt chosen through the picker and sent, shown in its modal; the whole-history search on the seeder's most frequent shop, scrolled; the week's breakdown unfolded and its bar read |
| 2:41 Exceptionals | the page, two cards hovered |
| 2:49 Categories | the tiles hovered, one opened for edit and left unchanged by ⎋ |
| 3:02 Statistics | the page scrolled at a reading pace; four days of the heatmap and its distribution bar hovered; the weekday rows hovered; the search timeline given the same shop, its bars walked with the crosshair |

## The stills

`demo.shot("name", prepare?)` marks nine screens. It takes no picture at the time — it writes down
the URL, and the pictures are taken at the very end, once the recorder has stopped and the mp4 is
closed, by sending the same signed-in page back to each URL. They come out at 3840×2160, lossless
PNG, animations frozen, caret hidden, the harness's overlays painted out — **and in English**,
because the take switched the account there.

Four of them show something a URL cannot hold, so they pass a `prepare` step run on the revisited
page after it has settled and before the shutter: the category detail modal (the first breakdown
row clicked), the receipt modal (today's first row hovered, its receipt button clicked — by then
the button says *view*, not *add*), the heatmap and the search timeline scrolled into view (the
timeline's term and range are in the URL, so the search itself survives the revisit).

## Running it again

**The take writes six things into the seeded account** — a budget, a weekly ceiling, a fixed
expense, a spending, a receipt, a language — all on the current month. The language is the one
that would break the next take, and `demo.setup.ts` puts it back to French through the same
`PATCH /users/me` the user menu uses. The rest accumulates: every take adds one `Salle de sport`
to the fixed expenses and one `Boulangerie du canal` to today, and moves the budget and the
ceiling up by a hundred and thirty euros. Harmless for a few takes; `pnpm seed -- --wipe --from …`
in `nest-api/` rebuilds the account from scratch when it is not.

Nothing is ever deleted. This app puts `Delete` next to `Edit` on every row, tile and modal it
opens, and the receipt modal's one button once a picture is up is `Delete receipt` — so rows are
hovered near their text (`aim: "text"`), the edit button is aimed by its label, and every modal
is left with ⎋.

⚠️ **One live session per account.** Every sign-in — the setup project's, then the take's own —
revokes the others (`nest-api/src/users/users.controller.ts`). Your own tab on `local.dev@mock.io`
is signed out the moment a take starts, and a sign-in of yours mid-take 401s every request the
film makes.

Nothing that moves is asserted: every amount counts up, every date is today's. Waits are on the
things the seeder fixes — a labelled graphic, a card of today, the label just typed.

## PFA-specific traps

**The app changes language halfway through the take.** Every element the storyboard touches
carries a `data-testid` — the same contract as the other four harnesses, ~35 marks added by
PFA-180 — so nothing it clicks or hovers depends on a label. The copy modules (`@text/index`)
are read only to check what a bubble or a link says: `fr` before the user menu, `en` after it.
The stills, taken after the take, run in `en`.

**Some marks exist twice.** The week picker, the period buttons (`current-month`, `today`), the
search trigger and the month picker are rendered as a desktop copy and a mobile one, hidden from
each other by CSS; the storyboard addresses them through `filter({ visible: true })`. The nav
links carry `data-route`; the drawer's copies are `aria-hidden` and off-screen at 1920px.

**The graphics hit-test the cursor from one handler.** The donut resolves the pointer's angle to
an arc, the stacked bars its x to a segment, the timeline its x to a bucket; none of them has a
per-mark element to aim `moveTo` at, and the donut's arcs are dashes on a circle whose bounding
box is the whole ring — aiming at one lands in the hole. `Demo.glide(x, y)` is the one method
this copy adds to `fixture.ts`: the storyboard works the point out from the geometry (the arcs'
dash arrays, the bars' rects) and walks the hand there. The stacked bars' segments and the
heatmap's cells are real elements and take a plain `moveTo`.

**Two rows share every action title.** The receipt button says *Add a receipt* until a picture is
up and *View the receipt* after, so the still's `prepare` matches either.

**The week picker is `react-day-picker` 7.** Its month arrows are `.DayPicker-NavButton--prev`,
its days `.DayPicker-Day` with the number as text, and the neighbouring months' days carry
`--outside` — filtered out, or the 15th would match three times.

**The combobox is `cmdk`.** Its items are `role="option"`; the category is picked by reading the
list, typing the first three letters of the second one into the command input, then clicking the
option with that exact name.

**The scroll anchor is the sticky filter bar.** The wheel goes to whatever is under the pointer,
and `moveTo(main)` would scroll `main` into view first — its centre is below the fold. The
statistics page is scrolled with the pointer parked on the sticky bar, which stays under it
however far the page has gone.

## Knobs

The same as Trekker's, all environment variables: `DEMO_SPEED`, `DEMO_HEADED=1`, `DEMO_WIDTH` /
`DEMO_HEIGHT`, `DEMO_SCALE=1`, `DEMO_TITLES=on`, `DEMO_CURSOR=off`, `DEMO_FPS`, `DEMO_CRF`,
`DEMO_FFMPEG`, `DEMO_RECORDER=playwright`, `E2E_BASE_URL` (default `http://localhost:3000`), plus
`DEMO_API_URL` (default `http://localhost:6100`, what preflight probes and the setup signs in to).

## What this run actually measured

On an 8-core M1, at 1920×1080 with the default 2× supersampling.

| | |
|---|---|
| The take | 228.4s, 6 chapters, **4839 frames at 21.2fps** — the app repaints on hover and on every count-up, and sits still between them, so the screencast lands near its floor as Zeus and Trekker do |
| The file | **14.3 MB**, h264, 1920×1080, chapters inside it |
| Stills | 9 × 3840×2160 PNG, 430–830 KB each, 5.5 MB the set |
| Repeatability | the same storyboard came out at 228.8s, 225.2s and 228.4s on consecutive takes; the chapter marks moved by three seconds at most |
| The one hang | one take out of seven froze on the receipt modal's `Send` after a hot reload of the thirty-five components that took their `data-testid` — the page had stopped painting, the upload had still gone through. It never recurred, and the same beat replayed headless in three seconds. Let a hot reload finish before starting a take |

## What this ticket changed outside the harness

- `next.config.js`: the CSP's `connect-src` names `NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST` in any
  build, not only in development.
- `src/auth/server/getServerSession.ts`: the same variable overrides the header-derived API base
  in any build.
- `package.json`: `video:generate`. `.env.test.local.example`: `DEMO_USERNAME` / `DEMO_PASSWORD`.
- The root `.gitignore`: `front/e2e/demo/out/`.
- ~35 `data-testid`s across `src/components/` and `src/lib/dataviz/`, one per mark the
  storyboard touches — login fields, nav links (`data-route`), the month picker and its cells
  (`data-month`), the user menu and its locales (`data-locale`), the budget and ceiling edits,
  the fixed-expense card, the category breakdown and its detail modal, the spending modal and
  its fields, the category options (`data-category`), the week picker, the day cards and their
  rows (`tx-row` with `data-has-receipt`), the receipt modal, the search palette, the
  exceptional items, the category tiles, the statistics filter bar, the heatmap and its
  distribution, the weekday plot, the search timeline, and the cursor tooltip. `Donut`,
  `StackedBar`, `Dropzone` and `PasswordField` take a `testId` prop for it; the shadcn
  primitives already spread their rest props.
