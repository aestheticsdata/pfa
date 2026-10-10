"use client";

import { keyBytes, PUSH_STATE } from "@components/panel/incidents/pushSupport";
import { useToastStore } from "@components/panel/shared/toastStore";
import Button from "@components/ui/Button";
import Card from "@components/ui/Card";
import CardHeader from "@components/ui/CardHeader";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { subscribePush, unsubscribePush } from "@lib/panel/panelActions";
import { INCIDENTS_TEXT } from "@text/metrics";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import type { PushCardProps } from "@components/panel/incidents/interfaces/incidentsTypes";

/**
 * This device and the incident alarm (Web Push, the back-office's own service worker — no relay).
 * Not in the handoff: the smallest control that lets the phone subscribe, in the existing style.
 */
const PushCard = ({ push }: PushCardProps) => {
  const router = useRouter();
  const show = useToastStore((state) => state.show);
  const [state, setState] = useState<string>(PUSH_STATE.off);
  const [pending, start] = useTransition();
  const text = INCIDENTS_TEXT.push;

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState(PUSH_STATE.unsupported);
      return;
    }
    if (Notification.permission === "denied") {
      setState(PUSH_STATE.denied);
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? PUSH_STATE.on : PUSH_STATE.off))
      .catch(() => setState(PUSH_STATE.unsupported));
  }, []);

  const enable = () =>
    start(async () => {
      if (!push.publicKey || (await Notification.requestPermission()) !== "granted") {
        setState(Notification.permission === "denied" ? PUSH_STATE.denied : PUSH_STATE.off);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(push.publicKey),
      });
      const json = subscription.toJSON();
      const result = await subscribePush({
        endpoint: json.endpoint ?? subscription.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      setState(result.ok ? PUSH_STATE.on : PUSH_STATE.off);
      show(result.ok ? text.on : (result.message ?? text.off));
      router.refresh();
    });

  const disable = () =>
    start(async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState(PUSH_STATE.off);
      router.refresh();
    });

  const line = !push.available
    ? text.unavailable
    : state === PUSH_STATE.unsupported
      ? text.unsupported
      : state === PUSH_STATE.denied
        ? text.denied
        : state === PUSH_STATE.on
          ? text.on
          : text.off;
  const canToggle = push.available && (state === PUSH_STATE.on || state === PUSH_STATE.off);

  return (
    <Card
      className="mt-3.5"
      testId="push-card"
    >
      <CardHeader
        title={text.title}
        sub={text.devices(push.devices)}
      />
      <div className="flex flex-wrap items-center gap-3 px-3.5 pt-2 pb-3">
        <p className="m-0 min-w-0 flex-1 text-body text-muted">{line}</p>
        {canToggle && (
          <Button
            variant={state === PUSH_STATE.on ? BUTTON_VARIANT.ghost : BUTTON_VARIANT.primary}
            size={BUTTON_SIZE.sm}
            disabled={pending}
            onClick={state === PUSH_STATE.on ? disable : enable}
          >
            {state === PUSH_STATE.on ? text.disable : text.enable}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PushCard;
