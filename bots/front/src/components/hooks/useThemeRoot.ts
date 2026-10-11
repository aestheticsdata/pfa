"use client";

import { useEffect, useState } from "react";

/**
 * The element carrying the app's theme (`data-theme-root`, the panel layout), for portals: a dialog
 * mounted in <body> would wear the runner's theme instead of the app's. Null until mounted, or
 * outside an app — the portal then falls back to <body>.
 */
export default function useThemeRoot(): HTMLElement | null {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setRoot(document.querySelector<HTMLElement>("[data-theme-root]"));
  }, []);
  return root;
}
