import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";
const SESSION_COOKIE = "bots.sid";
/** The screens reachable without a session; everything else — the app list included — needs one. */
const PUBLIC_PATHS = ["/signin", "/setup", "/recover"];

/** 16 random bytes, base64: unguessable and different on every request. */
const createNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

/**
 * Zeus's policy, tighter still: the browser talks to nothing but this origin — the API sits behind
 * the Next server, never called from the page — so `connect-src` is `'self'` in production too.
 * Fonts are self-hosted by `next/font`. Dev relaxes `script-src` for Turbopack's HMR scripts.
 */
const buildCsp = (nonce: string): string =>
  Object.entries({
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "script-src": ["'self'", ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : [`'nonce-${nonce}'`])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
    "frame-src": ["'none'"],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
  })
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ");

/**
 * The CSP with a per-request nonce (set on the request too: that is where Next reads it to nonce
 * its own scripts), and a first gate: no session cookie, no panel — straight to sign in. The API
 * checks the session for real on every call; this only spares a round trip.
 */
const proxy = (request: NextRequest): NextResponse => {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!isPublic && !request.cookies.has(SESSION_COOKIE)) {
    const signIn = new URL("/signin", request.url);
    if (pathname !== "/") signIn.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }

  const nonce = createNonce();
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
};

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js|manifest.webmanifest).*)"],
};
