/** A browser's Web Push subscription, as `PushManager.subscribe()` returns it. */
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** What lands on the phone. */
export interface PushMessage {
  title: string;
  body: string;
  /** Opened when the notification is tapped. */
  url: string;
  /** Same tag = the newer notification replaces the older one on the device. */
  tag: string;
}
