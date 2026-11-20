import { THEME_PREFERENCE, useThemePreference } from "@theme/themePreference";
import { COLOR_SCHEME, makeTheme } from "@theme/tokens";
import { useColorScheme } from "react-native";

const THEMES = { light: makeTheme(COLOR_SCHEME.light), dark: makeTheme(COLOR_SCHEME.dark) } as const;

/** The scheme on screen: the user's choice, or the system's when they chose to follow it. */
export const useColorSchemeName = () => {
  const preference = useThemePreference((state) => state.preference);
  const system = useColorScheme();
  if (preference !== THEME_PREFERENCE.system) return preference;
  return system === COLOR_SCHEME.light ? COLOR_SCHEME.light : COLOR_SCHEME.dark;
};

/** The full theme for the active scheme; both themes are built once, at load. */
export const useTheme = () => THEMES[useColorSchemeName()];
