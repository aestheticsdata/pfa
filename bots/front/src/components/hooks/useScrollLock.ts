"use client";

import { useEffect } from "react";

/** Locks the page scroll while a sheet, the purge modal or the mobile drawer is open (handoff `useLock`). */
export default function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [locked]);
}
