import { describeAmount, splitAmount } from "@lib/amount";
import { maxFontScale } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { AMOUNT_SIZE } from "@ui/variants";
import { Text } from "react-native";

import type { ThemeColor } from "@theme/interfaces/themeTypes";
import type { AmountSize } from "@ui/interfaces/uiTypes";
import type { StyleProp, TextStyle } from "react-native";

interface AmountProps {
  /** Integer cents. */
  cents: number;
  size?: AmountSize;
  color?: ThemeColor;
  /** Shows "+" before a positive amount (a variation, not a balance). */
  signed?: boolean;
  /** `• ••• ••` instead of the figure, while the app is locked. */
  masked?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * The only way an amount reaches the screen (handoff rule 3): Geist Mono, tabular digits, fr-FR
 * grouping, the decimals de-emphasised in `ink3`, and read in full by VoiceOver / TalkBack.
 */
export const Amount = ({ cents, size = AMOUNT_SIZE.regular, color = "ink", signed, masked, style }: AmountProps) => {
  const theme = useTheme();
  const { units, separator, decimals, currency } = splitAmount(cents, signed);
  const textStyle = [theme.type[size], { color: theme.colors[color] }, style];

  if (masked) {
    return (
      <Text
        style={textStyle}
        maxFontSizeMultiplier={maxFontScale.amount}
        accessibilityLabel="Montant masqué"
      >
        • ••• ••
      </Text>
    );
  }

  return (
    <Text
      style={textStyle}
      maxFontSizeMultiplier={maxFontScale.amount}
      accessibilityRole="text"
      accessibilityLabel={describeAmount(cents)}
    >
      {units}
      <Text style={{ color: theme.colors.ink3 }}>
        {separator}
        {decimals}
        {currency}
      </Text>
    </Text>
  );
};
