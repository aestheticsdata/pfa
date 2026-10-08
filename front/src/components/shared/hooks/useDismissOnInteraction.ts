"use client";

import { useEffect } from "react";

const INTERACTIONS = ["pointerdown", "wheel", "touchstart", "keydown"] as const;

/**
 * Calls `onDismiss` once, on the first click, wheel, touch or key press anywhere
 * — for transient overlays that should step aside the moment the user acts.
 */
export const useDismissOnInteraction = (onDismiss: () => void) => {
  useEffect(() => {
    const dismiss = () => {
      detach();
      onDismiss();
    };
    function detach() {
      for (const type of INTERACTIONS) window.removeEventListener(type, dismiss);
    }
    for (const type of INTERACTIONS) window.addEventListener(type, dismiss, { passive: true });
    return detach;
  }, [onDismiss]);
};
