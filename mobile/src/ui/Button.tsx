import { pressedOpacity } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { Gradient } from "@ui/Gradient";
import { BUTTON_VARIANT } from "@ui/variants";
import { Pressable, StyleSheet, View } from "react-native";

import type { ButtonVariant } from "@ui/interfaces/uiTypes";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Stretches to its container's width (the primary action of a sheet or a screen). */
  block?: boolean;
  accessibilityHint?: string;
}

/**
 * Primary = the CTA gradient, one per screen. Secondary = a quiet `surface2` pill. Text = an
 * `accent` link with a full touch target. Danger = destructive, `negative` on `negativeBg`.
 */
export const Button = ({
  label,
  onPress,
  variant = BUTTON_VARIANT.primary,
  disabled,
  block,
  accessibilityHint,
}: ButtonProps) => {
  const theme = useTheme();
  const { colors, layout, radius, space } = theme;

  const height = variant === BUTTON_VARIANT.primary ? layout.buttonHeight : layout.buttonHeightSecondary;
  const background = {
    [BUTTON_VARIANT.primary]: "transparent",
    [BUTTON_VARIANT.secondary]: colors.surface2,
    [BUTTON_VARIANT.text]: "transparent",
    [BUTTON_VARIANT.danger]: colors.negativeBg,
  }[variant];
  const textColor = (
    {
      [BUTTON_VARIANT.primary]: "onCta",
      [BUTTON_VARIANT.secondary]: "ink",
      [BUTTON_VARIANT.text]: "accent",
      [BUTTON_VARIANT.danger]: "negative",
    } as const
  )[variant];

  const content = (
    <AppText
      variant="headline"
      color={textColor}
    >
      {label}
    </AppText>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        {
          minHeight: Math.max(height, layout.minTouch),
          borderRadius: radius.pill,
          backgroundColor: background,
          alignSelf: block ? "stretch" : "flex-start",
          opacity: disabled ? 0.45 : pressed ? pressedOpacity : 1,
          overflow: "hidden",
        },
      ]}
    >
      {variant === BUTTON_VARIANT.primary ? (
        <Gradient
          token={theme.gradients.cta}
          style={[styles.center, { height, paddingHorizontal: space.xl }]}
        >
          {content}
        </Gradient>
      ) : (
        <View style={[styles.center, { height, paddingHorizontal: space.xl }]}>{content}</View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
