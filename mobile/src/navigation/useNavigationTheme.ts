import { COLOR_SCHEME, fonts } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { DarkTheme, DefaultTheme } from "expo-router";

/** React Navigation's theme fed from the PFA tokens, so headers and backgrounds match the app. */
export const useNavigationTheme = () => {
  const { scheme, colors } = useTheme();
  const base = scheme === COLOR_SCHEME.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.bg,
      text: colors.ink,
      border: colors.lineSoft,
      notification: colors.negative,
    },
    fonts: {
      ...base.fonts,
      regular: { fontFamily: fonts.sans.regular, fontWeight: "400" as const },
      medium: { fontFamily: fonts.sans.medium, fontWeight: "500" as const },
      bold: { fontFamily: fonts.sans.semibold, fontWeight: "600" as const },
      heavy: { fontFamily: fonts.sans.bold, fontWeight: "700" as const },
    },
  };
};
