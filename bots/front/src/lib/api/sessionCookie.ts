import "server-only";

import { SESSION_COOKIE } from "@lib/api/server";
import { cookies } from "next/headers";

/** A week: the API's own rolling 24 h window is what actually ends a session. */
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * The API sets the session cookie on the Next server's request; this mints the browser's copy —
 * HttpOnly, Secure in production, SameSite=Lax — from its `Set-Cookie`.
 */
export async function relaySessionCookie(res: Response): Promise<void> {
  const raw = res.headers.getSetCookie().find((line) => line.startsWith(`${SESSION_COOKIE}=`));
  const value = raw?.slice(SESSION_COOKIE.length + 1).split(";")[0];
  if (!value) return;
  // Stored decoded; Next encodes it on the way out and decodes it on the way in.
  (await cookies()).set(SESSION_COOKIE, decodeURIComponent(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
