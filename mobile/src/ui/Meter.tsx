import { clampRatio } from "@lib/ratio";
import { useTheme } from "@theme/useTheme";
import { Gradient } from "@ui/Gradient";
import { useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

interface MeterProps {
  /** Spent so far, as a share of the whole (0 → 1; more is drawn full). */
  value: number;
  /** Where the month (or week) is expected to end, hatched after `value`. */
  projection?: number;
  /** Today's position in the period, marked by a thin `accent` tick. */
  today?: number;
  /** Over budget: the fill turns `negative`. */
  over?: boolean;
  label: string;
}

const HATCH_ID = "meter-hatch";
const HATCH_GAP = 4;

/** A budget gauge: `surface3` track, `fill` gradient, hatched projection, today's tick. */
export const Meter = ({ value, projection, today, over, label }: MeterProps) => {
  const { colors, layout, radius, gradients, motion } = useTheme();
  const [width, setWidth] = useState(0);
  const ratio = clampRatio(value);

  // Animated on the UI thread: the fill grows from its previous width whenever the value changes.
  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(ratio * width, { duration: motion.durationChart }),
  }));
  const height = layout.meterHeight;
  const projected = projection === undefined ? 0 : Math.max(0, clampRatio(projection) - ratio);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: layout.todayMarker.height, justifyContent: "center" }}
    >
      <View style={{ height, borderRadius: radius.pill, backgroundColor: colors.surface3, overflow: "hidden" }}>
        {projected > 0 && width > 0 ? (
          <Svg
            width={projected * width}
            height={height}
            style={{ position: "absolute", left: ratio * width }}
          >
            <Defs>
              <Pattern
                id={HATCH_ID}
                width={HATCH_GAP}
                height={HATCH_GAP}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <Line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={HATCH_GAP}
                  stroke={colors.ink3}
                  strokeWidth={layout.focusRing}
                />
              </Pattern>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill={`url(#${HATCH_ID})`}
            />
          </Svg>
        ) : null}
        <Animated.View style={[{ height, borderRadius: radius.pill, overflow: "hidden" }, fillStyle]}>
          {over ? (
            <View style={{ flex: 1, backgroundColor: colors.negative }} />
          ) : (
            <Gradient
              token={gradients.fill}
              style={{ flex: 1 }}
            />
          )}
        </Animated.View>
      </View>
      {today === undefined || width === 0 ? null : (
        <View
          style={{
            position: "absolute",
            left: clampRatio(today) * width - layout.todayMarker.width / 2,
            width: layout.todayMarker.width,
            height: layout.todayMarker.height,
            borderRadius: layout.todayMarker.width,
            backgroundColor: colors.accent,
          }}
        />
      )}
    </View>
  );
};
