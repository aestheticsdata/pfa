import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { THEME_PREFERENCE, useThemePreference } from "@theme/themePreference";
import { Segmented } from "@ui/Segmented";

const OPTIONS = [
  { value: THEME_PREFERENCE.system, label: designSystemText.appearance.system },
  { value: THEME_PREFERENCE.light, label: designSystemText.appearance.light },
  { value: THEME_PREFERENCE.dark, label: designSystemText.appearance.dark },
] as const;

/** System / Light / Dark, the same switch Settings will carry. */
export const AppearanceSection = () => {
  const preference = useThemePreference((state) => state.preference);
  const setPreference = useThemePreference((state) => state.setPreference);
  return (
    <DemoSection title={designSystemText.sections.appearance}>
      <Segmented
        label={designSystemText.sections.appearance}
        options={OPTIONS}
        value={preference}
        onChange={setPreference}
      />
    </DemoSection>
  );
};
