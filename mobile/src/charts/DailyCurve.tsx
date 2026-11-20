import { areaPath, average, linearScale, linePath, toPoints } from "@charts/lib/scale";
import { useDrawIn } from "@hooks/useDrawIn";
import { Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, vec } from "@shopify/react-native-skia";
import { useTheme } from "@theme/useTheme";
import { useState } from "react";
import { View } from "react-native";

interface DailyCurveProps {
  /** One total per day of the month so far, in cents. */
  values: readonly number[];
  height: number;
  /** Spoken summary: a chart is invisible to a screen reader otherwise. */
  label: string;
}

const STROKE = 2;
const DOT_RADIUS = 4;
const DASH = [4, 4];
const FILL_OPACITY = 0.18;

/**
 * « Jour par jour » (screen 02): the month's daily spending as a `positive` line over a soft
 * gradient, the average dashed, today's point in `accent`. Drawn with Skia on the GPU; the line
 * draws itself in on mount, driven by a Reanimated value on the UI thread.
 */
export const DailyCurve = ({ values, height, label }: DailyCurveProps) => {
  const { colors, motion } = useTheme();
  const [width, setWidth] = useState(0);
  const progress = useDrawIn(values, motion.durationChart);

  const box = {
    left: DOT_RADIUS,
    top: DOT_RADIUS,
    width: Math.max(0, width - DOT_RADIUS * 2),
    height: height - DOT_RADIUS * 2,
  };
  const points = toPoints(values, box);
  const baseline = box.top + box.height;
  const max = Math.max(0, ...values);
  const averageY = linearScale([0, max], [baseline, box.top])(average(values));
  const today = points[points.length - 1];

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ height }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && points.length > 0 ? (
        <Canvas style={{ flex: 1 }}>
          <Path
            path={areaPath(points, baseline)}
            opacity={FILL_OPACITY}
          >
            <LinearGradient
              start={vec(0, box.top)}
              end={vec(0, baseline)}
              colors={[colors.positive, "transparent"]}
            />
          </Path>
          <Path
            path={`M${box.left} ${averageY} L${box.left + box.width} ${averageY}`}
            style="stroke"
            strokeWidth={1}
            color={colors.ink3}
          >
            <DashPathEffect intervals={DASH} />
          </Path>
          <Group>
            <Path
              path={linePath(points)}
              style="stroke"
              strokeWidth={STROKE}
              strokeJoin="round"
              strokeCap="round"
              color={colors.positive}
              start={0}
              end={progress}
            />
          </Group>
          {today ? (
            <Circle
              cx={today.x}
              cy={today.y}
              r={DOT_RADIUS}
              color={colors.accent}
            />
          ) : null}
        </Canvas>
      ) : null}
    </View>
  );
};
