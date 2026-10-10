"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** The handoff's live tick: every page re-reads the runner every 2 s. */
const REFRESH_MS = 2000;

/**
 * Re-renders the current route's server components every 2 s — the runner's numbers, live. Paused
 * while the tab is hidden: nobody is looking, and a phone in a pocket shouldn't poll ks-b.
 * Client state (drafts, selection, open menus) survives: a refresh keeps the React tree.
 */
const LiveRefresh = () => {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);
  return null;
};

export default LiveRefresh;
