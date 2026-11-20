import { usePulse } from "@hooks/usePulse";
import { useTheme } from "@theme/useTheme";
import Animated from "react-native-reanimated";

import type { DimensionValue } from "react-native";

interface SkeletonProps {
  width: DimensionValue;
  height: number;
  /** A pill for a line of text, the small radius for a block. */
  round?: boolean;
}

const DIM = 0.45;

/** A `surface3` placeholder that breathes while the first load runs; still under « Reduce motion ». */
export const Skeleton = ({ width, height, round }: SkeletonProps) => {
  const { colors, radius, motion } = useTheme();
  const pulse = usePulse(DIM, motion.durationChart);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: round ? radius.pill : radius.xs, backgroundColor: colors.surface3 },
        pulse,
      ]}
    />
  );
};
