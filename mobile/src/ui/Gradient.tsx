import { gradientPoints } from "@lib/gradient";
import { LinearGradient } from "expo-linear-gradient";

import type { GradientToken } from "@theme/interfaces/themeTypes";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

interface GradientProps {
  token: GradientToken;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** A gradient token from the theme, drawn at its CSS angle. */
export const Gradient = ({ token, style, children }: GradientProps) => {
  const { start, end } = gradientPoints(token.angle);
  return (
    <LinearGradient
      colors={token.colors as unknown as [string, string, ...string[]]}
      locations={token.locations as unknown as [number, number, ...number[]]}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};
