import type { ThemePreference } from "@theme/interfaces/themeTypes";

export interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}
