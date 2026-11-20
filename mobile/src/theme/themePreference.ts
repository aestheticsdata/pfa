import { storage } from "@lib/storage";
import { create } from "zustand";

import type { ThemePreferenceState } from "@theme/interfaces/themeStoreTypes";
import type { ThemePreference } from "@theme/interfaces/themeTypes";

export const THEME_PREFERENCE = { system: "system", light: "light", dark: "dark" } as const;

const STORAGE_KEY = "theme-preference";

const isPreference = (value: unknown): value is ThemePreference =>
  Object.values(THEME_PREFERENCE).some((preference) => preference === value);

const stored = storage.getString(STORAGE_KEY);

/** System / Light / Dark (Settings › Appearance), kept on the device across launches. */
export const useThemePreference = create<ThemePreferenceState>((set) => ({
  preference: isPreference(stored) ? stored : THEME_PREFERENCE.system,
  setPreference: (preference) => {
    storage.set(STORAGE_KEY, preference);
    set({ preference });
  },
}));
