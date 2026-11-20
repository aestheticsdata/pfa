import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { View } from "react-native";

import type { TextVariant } from "@ui/interfaces/uiTypes";

/** Each type token, named in its own style. Amounts use their mono tokens. */
export const TypeSection = () => {
  const { type, space } = useTheme();
  return (
    <DemoSection title={designSystemText.sections.type}>
      <View style={{ gap: space.sm }}>
        {(Object.keys(type) as TextVariant[]).map((variant) => (
          <AppText
            key={variant}
            variant={variant}
            numberOfLines={1}
          >
            {variant} · 1 577,18
          </AppText>
        ))}
      </View>
    </DemoSection>
  );
};
