import { useTheme } from "@theme/useTheme";
import { Gradient } from "@ui/Gradient";
import { View } from "react-native";

import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

interface CardProps {
  children: ReactNode;
  /** Inner padding; the token by default, 0 for a list that draws its own rows. */
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * GlowCard: a `surface` card inside a 1 px border drawn with the `glow` gradient — green at the
 * top left, blue at the bottom right. Shadow in light only; in dark the glow is the edge.
 */
export const Card = ({ children, padding, style }: CardProps) => {
  const theme = useTheme();
  const { radius, layout, colors } = theme;
  return (
    <View style={[{ borderRadius: radius.card }, theme.elevation.card(theme.scheme), style]}>
      <Gradient
        token={theme.gradients.glow}
        style={{ borderRadius: radius.card, padding: layout.hairline }}
      >
        <View
          style={{
            borderRadius: radius.card - layout.hairline,
            backgroundColor: colors.surface,
            padding: padding ?? layout.cardPadding,
            overflow: "hidden",
          }}
        >
          {children}
        </View>
      </Gradient>
    </View>
  );
};
