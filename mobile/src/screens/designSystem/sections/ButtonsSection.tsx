import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { Button } from "@ui/Button";
import { IconButton } from "@ui/IconButton";
import { BUTTON_VARIANT } from "@ui/variants";
import { Plus, Search } from "lucide-react-native";
import { View } from "react-native";

const noop = () => {};

export const ButtonsSection = () => {
  const { colors, layout, space } = useTheme();
  const { buttons } = designSystemText;
  return (
    <DemoSection title={designSystemText.sections.buttons}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
        <Button
          label={buttons.add}
          onPress={noop}
        />
        <Button
          label={buttons.cancel}
          onPress={noop}
          variant={BUTTON_VARIANT.secondary}
        />
        <Button
          label={buttons.enterCode}
          onPress={noop}
          variant={BUTTON_VARIANT.text}
        />
        <Button
          label={buttons.delete}
          onPress={noop}
          variant={BUTTON_VARIANT.danger}
        />
        <IconButton
          label={buttons.search}
          onPress={noop}
          icon={
            <Search
              size={layout.icon.md}
              strokeWidth={layout.iconStroke}
              color={colors.ink}
            />
          }
        />
        <IconButton
          primary
          label={buttons.add}
          onPress={noop}
          icon={
            <Plus
              size={layout.icon.lg}
              strokeWidth={layout.iconStroke}
              color={colors.onCta}
            />
          }
        />
      </View>
    </DemoSection>
  );
};
