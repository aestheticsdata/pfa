import { maxFontScale } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { useState } from "react";
import { TextInput, View } from "react-native";

import type { TextInputProps } from "react-native";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  /** Shown under the field in `negative`; the border turns `negative` too. */
  error?: string;
}

/** A 48 pt field: `line` border at rest, 1.5 `accent` with focus, 1.5 `negative` on error. */
export const TextField = ({ error, onFocus, onBlur, ...rest }: TextFieldProps) => {
  const { colors, layout, radius, space, type } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.negative : focused ? colors.accent : colors.line;
  const borderWidth = error || focused ? layout.focusRing : layout.hairline;

  return (
    <View style={{ gap: space.xs }}>
      <TextInput
        placeholderTextColor={colors.ink3}
        selectionColor={colors.accent}
        maxFontSizeMultiplier={maxFontScale.text}
        accessibilityHint={error}
        {...rest}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          type.body,
          {
            minHeight: layout.fieldHeight,
            paddingHorizontal: space.md,
            borderRadius: radius.sm,
            borderWidth,
            borderColor,
            backgroundColor: colors.surface,
            color: colors.ink,
          },
        ]}
      />
      {error ? (
        <AppText
          variant="footnote"
          color="negative"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
};
