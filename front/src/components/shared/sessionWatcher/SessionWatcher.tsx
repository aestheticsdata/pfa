"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import useRequestHelper from "@helpers/useRequestHelper";

// Minimum delay between two liveness probes, so focus + visibilitychange firing
// together on a tab switch (or rapid navigations) don't stack up requests.
const REVALIDATE_THROTTLE_MS = 10_000;

/**
 * Proactively re-checks the session on window focus, tab visibility, client-side
 * navigation and network reconnect. Without it, an idle tab whose pages are served
 * from the React Query cache issues no request, so an expired session goes unnoticed
 * until a stale-enough refetch or a mutation happens (the "2-3 clicks before being
 * kicked out" symptom).
 *
 * The probe goes through `privateRequest`, so an expired session (401) is handled by
 * the shared apiClient interceptor (redirect to /login); any other error is ignored so
 * a transient network blip never ejects the user. Mounted only under the `(private)`
 * layout, never on `/login`.
 */
const SessionWatcher = () => {
  const { privateRequest } = useRequestHelper();
  const pathname = usePathname();
  // Seeded to "now" so the first run — right after the server guard already validated
  // the session on this page load — doesn't fire a redundant probe.
  const lastCheck = useRef(Date.now());
  const revalidateRef = useRef<() => void>(() => {});

  revalidateRef.current = () => {
    const now = Date.now();
    if (now - lastCheck.current < REVALIDATE_THROTTLE_MS) {
      return;
    }
    lastCheck.current = now;
    // GET is a safe method (no CSRF needed). A 401 is handled by the interceptor; every
    // other outcome is intentionally swallowed so blips don't kick the user out.
    privateRequest("/users/me").catch(() => {});
  };

  useEffect(() => {
    const onFocus = () => revalidateRef.current();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        revalidateRef.current();
      }
    };
    const onOnline = () => revalidateRef.current();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // Re-check on client-side navigation (the first click after an idle period).
  useEffect(() => {
    revalidateRef.current();
  }, [pathname]);

  return null;
};

export default SessionWatcher;
