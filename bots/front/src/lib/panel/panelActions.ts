"use server";

import { ApiError } from "@lib/api/apiError";
import { api } from "@lib/api/server";
import { redirect } from "next/navigation";

import type { ActionResult, ApiCall } from "@lib/api/interfaces/apiTypes";
import type {
  AccountClosureInput,
  ActionToggle,
  BotsToggle,
  PushSubscriptionJson,
  QuietHoursInput,
  RampInput,
} from "@lib/panel/interfaces/panelActionTypes";

const app = (id: string) => `/apps/${encodeURIComponent(id)}`;

/**
 * Every change the panel makes: one API call with the session's CSRF token. A dead session sends
 * the operator back to sign in; anything else comes back as a message for the toast.
 */
async function change(call: ApiCall): Promise<ActionResult> {
  try {
    await api({ ...call, csrf: true });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect("/signin?expired=1");
      return { ok: false, message: error.message, errorCode: error.body.errorCode };
    }
    return { ok: false, message: String(error) };
  }
}

export async function setRunning(appId: string, running: boolean): Promise<ActionResult> {
  return change({ path: `${app(appId)}/runner`, method: "POST", body: { running } });
}

export async function setTarget(appId: string, target: number): Promise<ActionResult> {
  return change({ path: `${app(appId)}/target`, method: "PUT", body: { target } });
}

export async function setLoad(appId: string, enabled: boolean): Promise<ActionResult> {
  return change({ path: `${app(appId)}/load`, method: "PUT", body: { enabled } });
}

export async function setLoadPace(appId: string, pace: string): Promise<ActionResult> {
  return change({ path: `${app(appId)}/load-pace`, method: "PUT", body: { pace } });
}

export async function setRamp(input: RampInput): Promise<ActionResult> {
  return change({
    path: `${app(input.app)}/ramp`,
    method: "PUT",
    body: { step: input.step, everySec: input.everySec },
  });
}

export async function setQuietHours(input: QuietHoursInput): Promise<ActionResult> {
  return change({ path: `${app(input.app)}/quiet-hours`, method: "PUT", body: { from: input.from, to: input.to } });
}

export async function setBots(input: BotsToggle): Promise<ActionResult> {
  return input.ids.length === 1
    ? change({
        path: `${app(input.app)}/bots/${encodeURIComponent(input.ids[0] ?? "")}`,
        method: "PATCH",
        body: { enabled: input.enabled },
      })
    : change({ path: `${app(input.app)}/bots-bulk`, method: "POST", body: { ids: input.ids, enabled: input.enabled } });
}

export async function restartSession(appId: string, bot: string): Promise<ActionResult> {
  return change({ path: `${app(appId)}/bots/${encodeURIComponent(bot)}/restart-session`, method: "POST" });
}

export async function setAction(input: ActionToggle): Promise<ActionResult> {
  return change({
    path: `${app(input.app)}/actions/${encodeURIComponent(input.name)}`,
    method: "PATCH",
    body: { enabled: input.enabled },
  });
}

export async function enableAllActions(appId: string): Promise<ActionResult> {
  return change({ path: `${app(appId)}/actions-enable-all`, method: "POST" });
}

export async function acknowledge(appId: string, incident: string): Promise<ActionResult> {
  return change({ path: `${app(appId)}/incidents/${encodeURIComponent(incident)}/ack`, method: "POST" });
}

export async function closeAccount(input: AccountClosureInput): Promise<ActionResult> {
  return change({
    path: `${app(input.app)}/bots/${encodeURIComponent(input.bot)}/close-account`,
    method: "POST",
    body: { purge: input.purge },
  });
}

export async function subscribePush(subscription: PushSubscriptionJson): Promise<ActionResult> {
  return change({ path: "/push/subscriptions", method: "POST", body: subscription });
}

export async function unsubscribePush(endpoint: string): Promise<ActionResult> {
  return change({ path: "/push/subscriptions", method: "DELETE", body: { endpoint } });
}
