import { useTheme } from "@theme/useTheme";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

/**
 * Laid over the whole app while it is inactive, so the app-switcher snapshot shows a frosted
 * screen instead of the user's figures.
 */
export const PrivacyCover = () => {
  const { scheme, colors } = useTheme();
  return (
    <BlurView
      intensity={60}
      tint={scheme}
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};
