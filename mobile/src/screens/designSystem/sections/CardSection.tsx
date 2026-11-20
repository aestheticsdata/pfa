import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { Amount } from "@ui/Amount";
import { AppText } from "@ui/AppText";
import { Badge } from "@ui/Badge";
import { Card } from "@ui/Card";
import { Meter } from "@ui/Meter";
import { AMOUNT_SIZE, BADGE_TONE } from "@ui/variants";
import { View } from "react-native";

const SAMPLE_REMAINING_CENTS = 157_718;

export const CardSection = () => {
  const { space } = useTheme();
  const { card } = designSystemText;
  return (
    <DemoSection title={designSystemText.sections.card}>
      <Card>
        <View style={{ gap: space.md }}>
          <AppText
            variant="overline"
            color="ink2"
          >
            {card.remaining}
          </AppText>
          <Amount
            cents={SAMPLE_REMAINING_CENTS}
            size={AMOUNT_SIZE.xl}
          />
          <Meter
            value={0.63}
            projection={0.82}
            today={0.66}
            label={card.meterLabel}
          />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Badge
              label={card.down}
              tone={BADGE_TONE.positive}
            />
            <Badge
              label={card.up}
              tone={BADGE_TONE.negative}
            />
            <Badge
              label={card.exceptional}
              tone={BADGE_TONE.exceptional}
            />
          </View>
        </View>
      </Card>
    </DemoSection>
  );
};
