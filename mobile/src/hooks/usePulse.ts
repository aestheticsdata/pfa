import { useEffect } from "react";
import { ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

/**
 * An opacity that breathes between 1 and `dim` forever, on the UI thread. Honours the system's
 * « Reduce motion »: the value then stays put.
 */
export const usePulse = (dim: number, duration: number) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(dim, { duration, reduceMotion: ReduceMotion.System }), -1, true);
  }, [opacity, dim, duration]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
};
