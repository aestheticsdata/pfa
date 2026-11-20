import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { CategoryMarker } from "@ui/CategoryMarker";
import { Pressable } from "react-native";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** A count after the label, in `ink3` (« Courses 4 »). */
  count?: number;
  /** A category dot before the label. */
  dotColor?: string;
}

/** A 36 pt filter chip whose touch target is stretched to 44 by `hitSlop`. */
export const Chip = ({ label, selected, onPress, count, dotColor }: ChipProps) => {
  const { colors, layout, radius, space } = useTheme();
  const slop = (layout.minTouch - layout.chipHeight) / 2;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: slop, bottom: slop }}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={{
        height: layout.chipHeight,
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs + space.xxs,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        borderWidth: layout.hairline,
        borderColor: selected ? colors.positiveLine : "transparent",
        backgroundColor: selected ? colors.positiveBg : colors.surface2,
      }}
    >
      {dotColor ? (
        <CategoryMarker
          color={dotColor}
          dot
        />
      ) : null}
      <AppText
        variant="subhead"
        color={selected ? "positive" : "ink"}
      >
        {label}
      </AppText>
      {count === undefined ? null : (
        <AppText
          variant="subhead"
          color={selected ? "positive" : "ink3"}
        >
          {count}
        </AppText>
      )}
    </Pressable>
  );
};
