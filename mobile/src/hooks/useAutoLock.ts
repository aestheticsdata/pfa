import { useAuth } from "@auth/authStore";
import { shouldLockOnReturn } from "@auth/lockTimer";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

const BACKGROUND = "background";
const ACTIVE = "active";

/**
 * Locks the app when it comes back after `autoLockDelay` in the background (default 1 min). The
 * clock starts when the app leaves the screen, not when the phone sleeps.
 */
export const useAutoLock = () => {
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === BACKGROUND) {
        backgroundedAt.current = Date.now();
        return;
      }
      if (next !== ACTIVE) return;
      const { autoLockDelay, lock } = useAuth.getState();
      if (shouldLockOnReturn(backgroundedAt.current, Date.now(), autoLockDelay)) lock();
      backgroundedAt.current = null;
    });
    return () => subscription.remove();
  }, []);
};
