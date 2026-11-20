import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { View } from "react-native";

import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  /** Right side: a day total, a « Tout voir » link. */
  trailing?: ReactNode;
  /** The overline style (small caps) instead of a bold label. */
  overline?: boolean;
}

/** The label above a group of rows or cards. */
export const SectionHeader = ({ title, trailing, overline }: SectionHeaderProps) => {
  const { space, layout } = useTheme();
  return (
    <View
      accessibilityRole="header"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: layout.screenMargin,
        paddingTop: space.lg,
        paddingBottom: space.sm,
      }}
    >
      <AppText
        variant={overline ? "overline" : "subhead"}
        color={overline ? "ink3" : "ink"}
      >
        {title}
      </AppText>
      {trailing}
    </View>
  );
};
