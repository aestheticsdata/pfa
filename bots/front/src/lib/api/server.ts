import "server-only";

import { ApiError } from "@lib/api/apiError";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthState } from "@contracts/interfaces/authTypes";
import type { ApiCall } from "@lib/api/interfaces/apiTypes";

/** The back-office API: loopback only, never reachable from the browser. */
const API_URL = (process.env.BOTS_API_URL ?? "http://127.0.0.1:7200/api").replace(/\/$/, "");
export const SESSION_COOKIE = "bots.sid";
export const SIGN_IN_EXPIRED = "/signin?expired=1";

/**
 * The headers every call carries: the browser's session cookie, and where the browser is —
 * nginx's `X-Forwarded-For`, passed on unchanged so the API's rate limits and audit rows see the
 * operator's address, not 127.0.0.1.
 */
async function forwarded(): Promise<Record<string, string>> {
  const [jar, incoming] = await Promise.all([cookies(), headers()]);
  const out: Record<string, string> = { accept: "application/json" };
  const session = jar.get(SESSION_COOKIE);
  if (session) out.cookie = `${SESSION_COOKIE}=${encodeURIComponent(session.value)}`;
  const forwardedFor = incoming.get("x-forwarded-for");
  if (forwardedFor) out["x-forwarded-for"] = forwardedFor;
  const userAgent = incoming.get("user-agent");
  if (userAgent) out["user-agent"] = userAgent;
  return out;
}

/** Calls the API; the raw response, for the auth actions that relay its cookie. */
export async function apiResponse(call: ApiCall): Promise<Response> {
  const head = await forwarded();
  if (call.body !== undefined) head["content-type"] = "application/json";
  if (call.csrf) {
    const state = await apiGet<AuthState>("/auth/state");
    if (state.csrfToken) head["x-csrf-token"] = state.csrfToken;
  }
  return fetch(`${API_URL}${call.path}`, {
    method: call.method ?? "GET",
    headers: head,
    body: call.body === undefined ? undefined : JSON.stringify(call.body),
    cache: "no-store",
  });
}

/** Calls the API and reads its JSON; a refusal throws `ApiError`. */
export async function api<T>(call: ApiCall): Promise<T> {
  const res = await apiResponse(call);
  const body = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) throw new ApiError(res.status, body as never);
  return body;
}

export function apiGet<T>(path: string): Promise<T> {
  return api<T>({ path });
}

/**
 * For pages: a read that sends the operator back to sign in when the session is gone. Other
 * failures throw on, to the nearest `catchError` boundary (which offers a retry).
 */
export async function pageData<T>(path: string): Promise<T> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(SIGN_IN_EXPIRED);
    throw error;
  }
}
