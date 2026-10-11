/**
 * Browser-side error reporting for Iknos — the reference implementation.
 *
 * This file is meant to be **copied into the other fronts of the fleet**, not imported from them.
 * It has no dependencies, reads three public environment variables, and does nothing at all when
 * they are unset. A fourth, the release, is optional: stamped by the deploy, absent in dev.
 *
 * What it sends is ECS, the same shape every app already prints to stdout. That is the whole
 * point: a posted browser error and a tailed server line go through one parser and land in the
 * same columns, so the Logs view cannot tell — and does not need to tell — which door a line
 * came through.
 *
 * The rule that governs every decision below: **error reporting must never break the page it is
 * watching.** Nothing here throws, nothing here retries forever, and a failure to report is
 * simply the end of the matter.
 */

/**
 * Same-origin `/api/ingest` in production, where nginx routes `/api/` straight to the API and no
 * redirect is involved.
 *
 * In development the front proxies `/api/*` itself, and `trailingSlash: true` makes it answer 308
 * to `/api/ingest` first. `fetch` follows that on its own, so it works — but it is a wasted round
 * trip on a request sent while the page is closing, which is the one moment there is no time for
 * one. Worth knowing before wondering why a dev POST shows up twice in the network panel.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_IKNOS_INGEST_URL;
const TOKEN = process.env.NEXT_PUBLIC_IKNOS_INGEST_TOKEN;
const SERVICE = process.env.NEXT_PUBLIC_IKNOS_SERVICE;

/**
 * The commit this bundle was built from, inlined at build time by the deploy script (PFA-212), so
 * an error in Iknos says which deploy threw it. `service.version` is the ECS field the API's own
 * lines carry. Unset in dev, and then the field is left out rather than filled with a guess.
 */
const RELEASE = process.env.NEXT_PUBLIC_APP_RELEASE;

/** Matches `MAX_EVENTS_PER_REQUEST` in the API. Sending more would be rejected wholesale. */
const MAX_BATCH = 100;

/** Long enough to coalesce a burst, short enough that a live tail still feels live. */
const FLUSH_INTERVAL_MS = 3_000;

/**
 * A component throwing on every render can produce thousands of identical errors a second. The
 * first few are the diagnosis; the rest are a denial of service against your own database.
 */
const MAX_EVENTS_PER_PAGE = 50;
const DEDUPE_WINDOW_MS = 10_000;

type EcsEvent = Record<string, unknown>;

/** The fields of a Web Vitals metric this file reads — structural, so it needs no import from Next. */
interface WebVital {
  name: string;
  value: number;
  rating?: string;
  id: string;
  navigationType?: string;
}

/**
 * The three Core Web Vitals. Next also reports FCP, TTFB and its own hydration timings; they are
 * diagnostics, not the numbers anyone is asked to keep green, and each one is another POST.
 */
const REPORTED_VITALS = new Set(["LCP", "INP", "CLS"]);

let queue: EcsEvent[] = [];
let sent = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const recent = new Map<string, number>();

/**
 * A navigation breadcrumb, attached to whatever error comes next.
 *
 * One value rather than a trail: "which page did they come from" answers most of what a
 * breadcrumb list is asked, and a single string cannot grow without bound.
 */
let cameFrom: string | null = null;

const enabled = (): boolean => Boolean(ENDPOINT && TOKEN && SERVICE);

/** Bounded, and cleaned as it goes — an unbounded dedupe map is itself a leak. */
function isRepeat(key: string): boolean {
  const now = Date.now();
  for (const [seen, at] of recent) {
    if (now - at > DEDUPE_WINDOW_MS) recent.delete(seen);
  }

  if (recent.has(key)) return true;
  recent.set(key, now);
  return false;
}

/**
 * `fetch` with `keepalive`, not `navigator.sendBeacon`.
 *
 * Both survive the page being closed, but a beacon cannot set request headers — and the token
 * travels in one. Moving the token into the body to suit the beacon would mean two shapes on the
 * server for one route, which is a worse trade than losing a transport nothing else needed.
 */
function send(events: EcsEvent[]): void {
  if (events.length === 0 || !enabled()) return;

  try {
    void fetch(ENDPOINT as string, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", "X-Iknos-Token": TOKEN as string },
      body: JSON.stringify({ service: SERVICE, events }),
      // The reporter must never carry the session cookie: it posts to a route that does not want
      // one, and sending credentials to an endpoint that ignores them is how they end up in a log.
      credentials: "omit",
    }).catch(() => {
      // Deliberately empty. Reporting the failure to report is an infinite loop with extra steps.
    });
  } catch {
    // `fetch` itself can throw synchronously on a malformed URL. Same answer.
  }
}

function flush(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }

  const batch = queue;
  queue = [];
  send(batch);
}

/** Stamps the context every event shares and queues it for the next flush. */
function enqueue(event: EcsEvent): void {
  queue.push({
    "@timestamp": new Date().toISOString(),
    "log.level": "error",
    "url.path": window.location.pathname,
    ...(RELEASE ? { "service.version": RELEASE } : {}),
    // Everything the API does not promote to a column lands in `attrs`, so context is free to
    // add and costs nothing to leave out.
    ...(cameFrom === null ? {} : { navigated_from: cameFrom }),
    ...event,
  });

  if (queue.length >= MAX_BATCH) {
    flush();
    return;
  }
  if (timer === null) timer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

/**
 * Queues one ECS event.
 *
 * Exported so application code can report deliberately — a caught error worth knowing about, a
 * failed request the UI recovered from. Uncaught errors arrive here on their own.
 */
export function report(event: EcsEvent): void {
  try {
    if (!enabled() || sent >= MAX_EVENTS_PER_PAGE) return;

    const key = String(event.message ?? "");
    if (key !== "" && isRepeat(key)) return;

    sent += 1;
    enqueue(event);
  } catch {
    // Whatever went wrong here, the page carries on.
  }
}

/**
 * Queues one Core Web Vital (PFA-212), handed over by Next's `useReportWebVitals`.
 *
 * Outside the error budget and the dedupe on purpose: there are at most three per page view, the
 * same name legitimately repeats on every navigation, and a page that is throwing must not also
 * lose the measurement of how slow it was. Info level — a slow page is a number, not an incident;
 * `rating` is what says whether it is a bad one.
 */
export function reportWebVital(metric: WebVital): void {
  try {
    if (!enabled() || !REPORTED_VITALS.has(metric.name)) return;

    enqueue({
      "log.level": "info",
      message: `web vital ${metric.name}`,
      web_vital: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating ?? null,
        id: metric.id,
        navigation_type: metric.navigationType ?? null,
      },
    });
  } catch {
    // Measuring the page must never break it either.
  }
}

/** The stack is the diagnosis; without it a browser error is a sentence with no address. */
function describe(value: unknown): EcsEvent {
  if (value instanceof Error) {
    return {
      message: `${value.name}: ${value.message}`,
      error: { type: value.name, message: value.message, stack_trace: value.stack ?? null },
    };
  }
  return { message: typeof value === "string" ? value : JSON.stringify(value) };
}

/**
 * Installs the global handlers. Called once, from `instrumentation-client.ts`.
 *
 * Only the two events that represent something genuinely uncaught. `console.error` is
 * deliberately not wrapped: React logs warnings through it constantly, and a reporter that
 * treated every one as an incident would bury the errors that are.
 */
export function initErrorReporting(): void {
  if (!enabled()) return;

  try {
    window.addEventListener("error", (e) => {
      report({
        ...describe(e.error ?? e.message),
        source: { file: e.filename, line: e.lineno, column: e.colno },
      });
    });

    window.addEventListener("unhandledrejection", (e) => {
      report({ ...describe(e.reason), unhandled_rejection: true });
    });

    // The last chance to get anything out. `pagehide` rather than `unload`, which browsers no
    // longer fire reliably and which disqualifies a page from the back/forward cache.
    window.addEventListener("pagehide", flush);
  } catch {
    // A browser that refuses the listeners simply has no reporting.
  }
}

export function noteNavigation(url: string): void {
  cameFrom = url;
}
