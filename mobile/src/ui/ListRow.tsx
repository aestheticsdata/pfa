import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";

import type { ReactNode } from "react";

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Left of the title: a category marker, a tile, an icon. */
  leading?: ReactNode;
  /** Right side: an amount, a switch, a value. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Draws a chevron after `trailing`, for a row that opens a screen. */
  chevron?: boolean;
  /** Hides the separator under the last row of a group. */
  last?: boolean;
}

/** A list row: 52 pt on one line, 58 pt on two, separator inset to the text. */
export const ListRow = ({ title, subtitle, leading, trailing, onPress, chevron, last }: ListRowProps) => {
  const { colors, layout, space } = useTheme();

  const body = (
    <View
      style={{
        minHeight: subtitle ? layout.rowHeightTwoLines : layout.rowHeight,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: layout.screenMargin,
      }}
    >
      {leading}
      <View
        style={{
          flex: 1,
          alignSelf: "stretch",
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          borderBottomWidth: last ? 0 : layout.hairline,
          borderBottomColor: colors.lineSoft,
        }}
      >
        <View style={{ flex: 1, paddingVertical: space.sm }}>
          <AppText
            variant="body"
            numberOfLines={1}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="footnote"
              color="ink3"
              numberOfLines={1}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {trailing}
        {chevron ? (
          <ChevronRight
            size={layout.icon.md}
            strokeWidth={layout.iconStroke}
            color={colors.ink3}
          />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : "transparent" })}
    >
      {body}
    </Pressable>
  );
};
