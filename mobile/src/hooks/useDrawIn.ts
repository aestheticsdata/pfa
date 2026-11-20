import { useEffect } from "react";
import { Easing, ReduceMotion, useSharedValue, withTiming } from "react-native-reanimated";

/**
 * A 0 → 1 progress that replays whenever `data` changes, for a chart drawing itself in. Lives on
 * the UI thread; with « Reduce motion » on, it jumps straight to 1.
 */
export const useDrawIn = (data: unknown, duration: number) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (data === undefined) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System });
  }, [progress, data, duration]);

  return progress;
};
