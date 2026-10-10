"use server";

import { AUTH_ERROR } from "@contracts/authErrors";
import { ApiError } from "@lib/api/apiError";
import { api, apiResponse } from "@lib/api/server";
import { clearSessionCookie, relaySessionCookie } from "@lib/api/sessionCookie";
import { AUTH_RULES, isEmail } from "@lib/auth/authRules";
import { AUTH_TEXT } from "@text/auth";
import { redirect } from "next/navigation";

import type { ApiErrorBody } from "@contracts/interfaces/authTypes";
import type { RecoverState, SetupState, SignInState } from "@lib/auth/interfaces/authFormTypes";

const text = (form: FormData, key: string): string => String(form.get(key) ?? "");

/** Where to go after signing in: a path on this site only, never an open redirect. */
const safeNext = (value: string): string => (value.startsWith("/") && !value.startsWith("//") ? value : "/");

export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  if (!email || !password) {
    return { message: AUTH_TEXT.signIn.invalid, lockedUntil: null, email };
  }
  const res = await apiResponse({ path: "/auth/signin", method: "POST", body: { email, password } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    if (body.errorCode === AUTH_ERROR.rateLimited) {
      return { message: null, lockedUntil: Date.now() + (body.retryAfterSec ?? 900) * 1000, email };
    }
    return { message: AUTH_TEXT.signIn.invalid, lockedUntil: null, email };
  }
  await relaySessionCookie(res);
  redirect(safeNext(text(form, "next")));
}

export async function setup(_previous: SetupState, form: FormData): Promise<SetupState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  const recoveryPassphrase = text(form, "recoveryPassphrase");
  const fields: Record<string, string> = {};
  if (!isEmail(email)) fields.email = AUTH_TEXT.setup.invalidEmail;
  if (password.length < AUTH_RULES.passwordMin) fields.password = AUTH_TEXT.setup.tooShort;
  if (text(form, "confirm") !== password) fields.confirm = AUTH_TEXT.setup.mismatch;
  if (!recoveryPassphrase.trim()) fields.recoveryPassphrase = AUTH_TEXT.setup.required;
  if (Object.keys(fields).length > 0) return { fields, message: null, email };

  const res = await apiResponse({ path: "/auth/setup", method: "POST", body: { email, password, recoveryPassphrase } });
  if (res.status === 409) redirect("/setup");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    return { fields: {}, message: [body.message].flat().join(" · "), email };
  }
  await relaySessionCookie(res);
  redirect("/");
}

export async function recover(_previous: RecoverState, form: FormData): Promise<RecoverState> {
  const email = text(form, "email").trim();
  const recoveryPassphrase = text(form, "recoveryPassphrase");
  const newPassword = text(form, "newPassword");
  const fields: Record<string, string> = {};
  if (!email) fields.email = AUTH_TEXT.recover.required;
  if (!recoveryPassphrase) fields.recoveryPassphrase = AUTH_TEXT.recover.required;
  if (newPassword.length < AUTH_RULES.passwordMin) fields.newPassword = AUTH_TEXT.setup.tooShort;
  if (Object.keys(fields).length > 0) return { fields, message: null, done: false, email };

  try {
    await api({ path: "/auth/recover", method: "POST", body: { email, recoveryPassphrase, newPassword } });
    return { fields: {}, message: null, done: true, email };
  } catch (error) {
    const limited = error instanceof ApiError && error.body.errorCode === AUTH_ERROR.rateLimited;
    const minutes = limited ? Math.ceil((error.body.retryAfterSec ?? 900) / 60) : 0;
    return {
      fields: {},
      message: limited ? AUTH_TEXT.signIn.tooMany(minutes) : AUTH_TEXT.recover.failed,
      done: false,
      email,
    };
  }
}

export async function signOut(): Promise<void> {
  await apiResponse({ path: "/auth/signout", method: "POST", csrf: true }).catch(() => undefined);
  await clearSessionCookie();
  redirect("/signin");
}
