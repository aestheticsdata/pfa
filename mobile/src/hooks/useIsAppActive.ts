import { useEffect, useState } from "react";
import { AppState } from "react-native";

const ACTIVE = "active";

/**
 * False while the app is inactive or in the background — the moment iOS takes the app-switcher
 * snapshot, and Android its recents thumbnail.
 */
export const useIsAppActive = () => {
  const [active, setActive] = useState(AppState.currentState === ACTIVE);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => setActive(next === ACTIVE));
    return () => subscription.remove();
  }, []);

  return active;
};
