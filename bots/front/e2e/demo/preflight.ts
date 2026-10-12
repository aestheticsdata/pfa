/**
 * Refusing to shoot before there is anything to shoot.
 *
 * Without this the first thing that happens is `demo.setup.ts` reporting
 * `net::ERR_CONNECTION_REFUSED` with a stack pointing into a file about signing in — which says
 * nothing about the actual problem. The take has three preconditions and none of them are the
 * script's to fix, so it names them instead.
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3014";

/** The API is a second origin, on loopback: the front's server reaches it, the browser never does. */
const API_URL = process.env.DEMO_API_URL ?? "http://127.0.0.1:7200";

async function reachable(url: string) {
  try {
    // Any answer at all is enough — a 401 or a redirect still proves something is listening.
    await fetch(url, { signal: AbortSignal.timeout(3000), redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

export default async function preflight() {
  const problems: string[] = [];

  if (!(await reachable(`${BASE_URL}/signin`))) {
    problems.push(
      `Nothing is listening on ${BASE_URL}.\n` +
        "    The demo films the back-office; it does not start it. In two shells:\n" +
        "      cd nest-api && pnpm dev        # BOTS_MODE=mock in its .env\n" +
        "      cd front && pnpm dev",
    );
  } else if (!(await reachable(`${API_URL}/api`))) {
    problems.push(
      `${BASE_URL} answers, but the API does not answer on ${API_URL}.\n` +
        "    Start it with `cd nest-api && pnpm dev` (BOTS_MODE=mock).",
    );
  }

  if (!process.env.DEMO_EMAIL || !process.env.DEMO_PASSWORD || !process.env.DEMO_PASSPHRASE) {
    problems.push("DEMO_EMAIL, DEMO_PASSWORD and DEMO_PASSPHRASE are missing from front/.env.test.local.");
  }

  if (problems.length > 0) {
    throw new Error(`\n\n  The demo cannot record yet:\n\n  - ${problems.join("\n\n  - ")}\n`);
  }
}
