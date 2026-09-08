/**
 * Refusing to shoot before there is anything to shoot.
 *
 * Without this the first thing that happens is `demo.setup.ts` reporting
 * `net::ERR_CONNECTION_REFUSED` with a stack pointing into a file about signing
 * in — which says nothing about the actual problem, and sends you looking at
 * credentials. The demo has three preconditions and none of them are the
 * script's to fix, so it names them instead.
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * The API is a second origin here, not a path under the front.
 *
 * On a laptop the browser client goes straight to Nest (`NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST`
 * in `front/.env.local`, honoured whenever the page is served from `localhost`); on ks-b nginx
 * puts both halves behind one domain. So probing `${BASE_URL}/api` would prove nothing: Next
 * answers there whether the API is up or not.
 */
const API_URL = process.env.DEMO_API_URL ?? "http://localhost:6100";

async function reachable(url: string): Promise<boolean> {
  try {
    // Any answer at all is enough — a 401 or a redirect still proves something
    // is listening, which is the whole question here.
    await fetch(url, { signal: AbortSignal.timeout(3000), redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

export default async function preflight(): Promise<void> {
  const problems: string[] = [];

  if (!(await reachable(`${BASE_URL}/login/`))) {
    problems.push(
      `Nothing is listening on ${BASE_URL}.\n` +
        "    The demo films the app; it does not start it. In two shells:\n" +
        "      cd nest-api && pnpm start:dev\n" +
        "      cd front && pnpm dev\n" +
        "    (or the production build on the same port: `pnpm build && pnpm exec next start -p 3000`\n" +
        "    — the API's CORS names that one origin). The dev overlays are painted out by the take.",
    );
  } else if (!(await reachable(`${API_URL}/api/users/csrf`))) {
    problems.push(
      `${BASE_URL} answers, but the Nest API does not answer on ${API_URL}.\n` +
        "    Start it with `cd nest-api && pnpm start:dev` (it listens on 6100).",
    );
  }

  if (!process.env.DEMO_USERNAME || !process.env.DEMO_PASSWORD) {
    problems.push("DEMO_USERNAME and DEMO_PASSWORD are missing from front/.env.test.local.");
  }

  if (problems.length > 0) {
    throw new Error(`\n\n  The demo cannot record yet:\n\n  - ${problems.join("\n\n  - ")}\n`);
  }
}
