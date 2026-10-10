/*
 * bot-runner back-office service worker: incident notifications only (PFA-127). No caching, no
 * offline: the panel is live data and must never show a stale copy.
 */
self.addEventListener("push", (event) => {
  let message = { title: "bot-runner", body: "", url: "/", tag: "bots" };
  try {
    message = { ...message, ...event.data.json() };
  } catch {
    // Not JSON: keep the defaults, still tell the operator something happened.
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      renotify: true,
      icon: "/icon.svg",
      data: { url: message.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (open) return open.navigate(url).then((client) => client?.focus());
      return self.clients.openWindow(url);
    }),
  );
});
