import { pressedOpacity } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { Gradient } from "@ui/Gradient";
import { Pressable, StyleSheet, View } from "react-native";

import type { ReactNode } from "react";

interface IconButtonProps {
  /** Spoken by VoiceOver / TalkBack: an icon alone says nothing. */
  label: string;
  onPress: () => void;
  icon: ReactNode;
  /** The CTA gradient, for the « + » that adds a spending. */
  primary?: boolean;
  size?: number;
}

/** A round icon-only control, 44 pt (iOS) / 48 dp (Android) at least. */
export const IconButton = ({ label, onPress, icon, primary, size }: IconButtonProps) => {
  const theme = useTheme();
  const diameter = Math.max(size ?? theme.layout.iconButton, theme.layout.minTouch);
  const shape = { width: diameter, height: diameter, borderRadius: diameter / 2 };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        shape,
        { backgroundColor: primary ? "transparent" : theme.colors.surface2, opacity: pressed ? pressedOpacity : 1 },
        primary ? theme.elevation.floating : null,
      ]}
    >
      {primary ? (
        <Gradient
          token={theme.gradients.cta}
          style={[shape, styles.center]}
        >
          {icon}
        </Gradient>
      ) : (
        <View style={[shape, styles.center]}>{icon}</View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
