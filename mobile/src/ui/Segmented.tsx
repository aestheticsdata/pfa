import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

import type { SegmentOption } from "@ui/interfaces/uiTypes";

interface SegmentedProps<Value extends string> {
  options: readonly SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  /** Read by screen readers as the group's name. */
  label: string;
}

/** A 38 pt segmented control whose active pill slides with a spring on the UI thread. */
export const Segmented = <Value extends string>({ options, value, onChange, label }: SegmentedProps<Value>) => {
  const { colors, layout, radius, space, motion } = useTheme();
  const [width, setWidth] = useState(0);
  const inset = space.xxs;
  const segmentWidth = options.length > 0 ? (width - inset * 2) / options.length : 0;
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(index * segmentWidth, motion.sheetSpring) }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        height: layout.segmentedHeight,
        flexDirection: "row",
        padding: inset,
        borderRadius: radius.sm,
        backgroundColor: colors.surface2,
      }}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: inset,
              bottom: inset,
              left: inset,
              width: segmentWidth,
              borderRadius: radius.sm - inset,
              backgroundColor: colors.segmentOn,
            },
            pillStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <AppText
              variant="subhead"
              color={selected ? "ink" : "ink2"}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};
