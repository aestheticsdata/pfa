import { expect, test as setup } from "@playwright/test";

/**
 * Putting the account back the way the take expects to find it.
 *
 * The take signs in on camera, so this project saves no session for it. What it does is undo the
 * one thing the previous take changed that the next one would inherit: the language. The
 * storyboard's second chapter switches the app to English through the user menu, and the API
 * persists that on the account (`PATCH /users/me`), where it wins over anything the browser
 * remembers — a take started on that account would open in English and every French label the
 * first two chapters look for would be missing.
 *
 * Through the API rather than the database: the same call the user menu makes, on the same guard.
 * The house dev account, never anything real — the film is for a public page.
 *
 * ⚠️ PFA keeps ONE live session per account: every sign-in — this one, then the take's own —
 * revokes the others (`nest-api/src/users/users.controller.ts`). Your own tab on `local.dev@mock.io`
 * is signed out the moment a take starts, and a sign-in of yours mid-take 401s every request the
 * film makes.
 */
const API_URL = process.env.DEMO_API_URL ?? "http://localhost:6100";

setup("put the dev account back in French", async ({ request }) => {
  const username = process.env.DEMO_USERNAME;
  const password = process.env.DEMO_PASSWORD;
  setup.skip(!username || !password, "set DEMO_USERNAME and DEMO_PASSWORD in .env.test.local");

  // Sign-in needs no CSRF token; it hands one back, and the session cookie it sets rides on
  // this request context for the call that follows.
  const signIn = await request.post(`${API_URL}/api/users`, { data: { email: username, password } });
  expect(signIn.ok(), `sign-in as ${username} answered ${signIn.status()} — check .env.test.local`).toBeTruthy();
  const { csrfToken } = (await signIn.json()) as { csrfToken: string };

  const patch = await request.patch(`${API_URL}/api/users/me`, {
    data: { language: "fr" },
    headers: { "x-csrf-token": csrfToken },
  });
  expect(patch.ok(), `PATCH /users/me answered ${patch.status()}`).toBeTruthy();
});
