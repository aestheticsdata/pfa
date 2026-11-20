# @pfa/shared

What the web (`front/`) and the mobile app (`mobile/`) share about the API (PFA-285).

| Folder | Holds |
| --- | --- |
| `src/schemas/` | zod schemas of every response and request body, and their inferred types. Strict outside production. |
| `src/schemas/__tests__/fixtures/` | Real, anonymised API responses; `apiContract.test.ts` parses each with its schema. |
| `src/api/` | `createApiClient` + two auth strategies: `cookieSessionAuth` (web: session cookie + CSRF) and `bearerAuth` (mobile: token from the secure store). |
| `src/api/fetchers/` | One plain function per endpoint, `(api, params) => Promise<parsed data>`. No React, no TanStack: each app wraps them in its own `queryOptions`. |
| `src/query/keys.ts` | Query-key families, so both apps invalidate the same way. |
| `src/money/` | Integer cents (`toCents`, `parseTypedAmount`) and fr-FR formatting. |
| `src/dates/` | PFA's week model: Sunday → Saturday, truncated to the month. |

Imports inside the package use `#…` (package.json `imports`), never relative paths; consumers import
`@pfa/shared/<path>`, e.g. `@pfa/shared/api/fetchers/dashboard`. The package ships TypeScript
source: Metro and Next compile it, nothing is built.

```bash
pnpm --filter @pfa/shared test
pnpm --filter @pfa/shared typecheck
pnpm --filter @pfa/shared lint
```

The web still uses its own copy in `front/src/schemas/` until it switches over in a later lot.
