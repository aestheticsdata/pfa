import { maxFontScale } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { Text } from "react-native";

import type { ThemeColor } from "@theme/interfaces/themeTypes";
import type { TextVariant } from "@ui/interfaces/uiTypes";
import type { TextProps } from "react-native";

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: ThemeColor;
}

/** Every piece of text: a type token, a colour token, and the Dynamic Type ceiling. */
export const AppText = ({ variant = "body", color = "ink", style, ...rest }: AppTextProps) => {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={maxFontScale.text}
      {...rest}
      style={[theme.type[variant], { color: theme.colors[color] }, style]}
    />
  );
};
