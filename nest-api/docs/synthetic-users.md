# Synthetic users — accounts and purge (PFA-122)

The synthetic-users bot runner (epic PFA-120) signs bots up through the public
`POST /api/users/add`, like a person would. Nothing in the API is special for
them except one flag.

## The flag

- `Users.isSynthetic` (`Boolean`, default `false`).
- Set **only** at signup, when the email is on the reserved domain
  **`@synthetic.test`** (`src/users/synthetic-email.util.ts`). Exact domain,
  case-insensitive: `bot@x.synthetic.test` or `bot@notsynthetic.test` are not
  synthetic.
- `.test` is reserved (RFC 2606): no real mailbox can exist there, so no real
  person can be flagged.

## Purge

```bash
pnpm synthetic:purge -- --dry-run   # count the synthetic accounts
pnpm synthetic:purge                # delete them and everything they own
```

An account is purged only when it is flagged **and** its email is on the
reserved domain — checked in SQL, then again in code before anything is
deleted (the script aborts if the two disagree). A real account that somehow
got the flag is never touched.

It deletes, in one transaction: spendings, spending groups, recurrings,
dashboards, exceptionals, categories, then the users; then each account's
invoices folder (`PFA_INVOICES_IMAGES_PATH/<userID>`). Their Redis sessions
are left to expire: the user no longer exists, so the API answers 401.

## Locked to the bot runner's address

A synthetic account can only be used from the addresses in `SYNTHETIC_ALLOWED_IPS`
(comma-separated: ks-b's address in production, `127.0.0.1,::1` for a runner on
your machine). Unset or empty, **every** bot request is refused: the guard fails
closed.

`SyntheticIpGuard` (global, `src/users/guards/`) refuses with a 403:

- a signup or sign-in with a `@synthetic.test` email from any other address — a
  stolen bot password is useless elsewhere;
- any request carrying a bot's session cookie from any other address — the
  session is destroyed on the spot, so the stolen cookie is dead too.

When sign-ups are closed (`SIGNUPS_ENABLED=false`, as in production), `SignupGuard`
still accepts a `@synthetic.test` signup from an allowlisted address — and only
that: every other signup stays refused.

Real accounts are never affected. The client address is the one nginx saw
(`trust proxy` = 1), never a client-forged `X-Forwarded-For`. The API listens on
`127.0.0.1` only (`main.ts`), so nothing outside the machine can reach it
without going through nginx, whatever the firewall says.

Each refusal logs one `warn` line, `event.kind: alert`,
`event.action: synthetic-foreign-ip`, with the email or user id, the address,
the path and the user agent. That line is what the bot back-office (PFA-127)
turns into a danger banner and a phone notification.
