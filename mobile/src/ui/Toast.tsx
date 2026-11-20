import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { Pressable } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** An inverted pill above the tab bar: a failed write and its « Réessayer », or « Annuler » after a delete. */
export const Toast = ({ message, actionLabel, onAction }: ToastProps) => {
  const { colors, radius, space, elevation } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          borderRadius: radius.pill,
          backgroundColor: colors.ink,
        },
        elevation.floating,
      ]}
    >
      <AppText
        variant="subhead"
        color="onInk"
        style={{ flex: 1 }}
      >
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          hitSlop={space.md}
        >
          <AppText
            variant="subhead"
            color="accent"
          >
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
};
