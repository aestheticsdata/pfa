import type { THEME_PREFERENCE } from "@theme/themePreference";
import type { COLOR_SCHEME, makeTheme } from "@theme/tokens";

export type ColorScheme = (typeof COLOR_SCHEME)[keyof typeof COLOR_SCHEME];

/** What the user picked in Settings: follow the system, or force one scheme. */
export type ThemePreference = (typeof THEME_PREFERENCE)[keyof typeof THEME_PREFERENCE];

export type Theme = ReturnType<typeof makeTheme>;

export type ThemeColor = keyof Theme["colors"];

/** A gradient as the tokens describe it: colours, stops and a CSS angle. */
export interface GradientToken {
  colors: readonly string[];
  locations: readonly number[];
  angle: number;
}
