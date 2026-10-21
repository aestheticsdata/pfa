# API contract fixtures

PFA-177. The front parses every api response with zod (`src/schemas/`), but the api has no output
contract of its own beyond its response interfaces. Since PFA-257 every row it returns goes through
an explicit Prisma `select`, so a new column reaches no response until someone lists it. The
fixtures are what proves a schema describes the api, not just a payload someone once looked at.

## The three pieces

| Piece | Where | What it does |
| --- | --- | --- |
| Fixtures | `src/schemas/__tests__/fixtures/<name>.json` | One real, anonymised response per endpoint and edge case. |
| Contract test | `src/schemas/__tests__/apiContract.test.ts` | Parses each fixture with the schema its fetcher uses. Red = drift. |
| Strict switch | `src/schemas/apiObject.ts` | Response objects reject unknown keys outside production. |

Because the schemas are strict in tests, the contract test fails both ways: a field renamed or
removed by the api, **and** a field the api added that the schema does not know yet.

In production the same schemas stay tolerant (unknown keys are stripped): an addition server-side
must never break the UI. `AuthResponseSchema` is never strict, even in dev — see `schemas/auth.ts`.

## Re-capturing after a back change

Needs the local api running (`nest-api`, port 6100) and the e2e account in `.env.test.local`
(`E2E_EMAIL`, `E2E_PASSWORD` — copy `.env.test.local.example`).

```bash
node scripts/captureApiFixtures.mjs
```

It signs in, calls every endpoint the front parses, and rewrites all the fixtures. Then:

```bash
pnpm test src/schemas
```

Review the fixture diff before committing it: it is the api's contract change, written out.

## Checked before every API deploy

`pnpm contract:check` (PFA-257) captures the local api into a scratch folder and runs the contract
test on that capture; the committed fixtures are not touched. `nest-api/deploy-api.sh` runs it in
its quality gate whenever the local api answers on :6100, and stops the deploy when it is red.
Start the api first (`pnpm --dir ../nest-api start:dev`) to have it checked rather than skipped.

### What the capture covers

The latest month with data (nominal case), plus the edge cases that broke widgets before: an empty
month and an empty year (2099), the account's very first month (projection `source: "none"`,
trends with no previous month), the second page of a search, a search by year only, and `/statistics` over
every category of the account.

### Anonymisation

Fixtures go to git, so no response is written raw:

- labels, names, descriptions and category names (including the category-name keys of
  `/statistics`) become invented words, consistently — the same real name always maps to the same
  fake one;
- amounts become invented numbers **of the same type** — a numeric string stays a string, since
  `numberLikeSchema` exists precisely because the api sends both;
- IDs become consistent fakes, the email `user@example.test`, the CSRF token a placeholder;
- dates, colours, counts and years are kept: they carry the shape, not the person.

Lists of rows are cut to 25 items.

## Adding an endpoint

1. Parse it with `parseResponse(Schema, response.data, "/route")` in its fetcher, never a bare
   `.parse()`.
2. Build its schema objects with `apiObject(...)`, not `z.object(...)`.
3. Add it to `ENDPOINTS` in `scripts/captureApiFixtures.mjs` and to `CONTRACTS` in
   `apiContract.test.ts` — the test fails while the two lists disagree.
4. Re-capture.

## When a response does not match in production

`parseResponse` reports the drift to Iknos (`report()` in `src/lib/report.ts`), then throws: the
query errors exactly as it did before, the UI has no new path. The report carries the endpoint
(without its query string), and per issue its zod code, message and path — with every key the user
chose (category names, years) replaced by `<key>` (`src/lib/redactIssuePath.ts`). Never the
payload or any value from it.
