import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { BADGE_TONE } from "@ui/variants";
import { View } from "react-native";

import type { BadgeTone } from "@ui/interfaces/uiTypes";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONES = {
  [BADGE_TONE.positive]: { text: "positive", background: "positiveBg" },
  [BADGE_TONE.negative]: { text: "negative", background: "negativeBg" },
  [BADGE_TONE.exceptional]: { text: "exceptional", background: "exceptionalBg" },
  [BADGE_TONE.warning]: { text: "warning", background: "warningBg" },
  [BADGE_TONE.neutral]: { text: "ink2", background: "surface2" },
} as const;

/**
 * A small status pill. Colour carries meaning, so the label always carries it too (« ↓ 37 % »,
 * « Exceptionnel »): nobody has to tell green from red.
 */
export const Badge = ({ label, tone = BADGE_TONE.neutral }: BadgeProps) => {
  const { colors, radius, space } = useTheme();
  const { text, background } = TONES[tone];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: space.sm - space.xxs,
        paddingVertical: space.xxs,
        borderRadius: radius.xs,
        backgroundColor: colors[background],
      }}
    >
      <AppText
        variant="caption"
        color={text}
      >
        {label}
      </AppText>
    </View>
  );
};
