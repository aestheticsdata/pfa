import { AppearanceSection } from "@screens/designSystem/sections/AppearanceSection";
import { ButtonsSection } from "@screens/designSystem/sections/ButtonsSection";
import { CardSection } from "@screens/designSystem/sections/CardSection";
import { ChartSection } from "@screens/designSystem/sections/ChartSection";
import { ColorsSection } from "@screens/designSystem/sections/ColorsSection";
import { ControlsSection } from "@screens/designSystem/sections/ControlsSection";
import { FieldsSection } from "@screens/designSystem/sections/FieldsSection";
import { RowsSection } from "@screens/designSystem/sections/RowsSection";
import { StatesSection } from "@screens/designSystem/sections/StatesSection";
import { TypeSection } from "@screens/designSystem/sections/TypeSection";
import { useTheme } from "@theme/useTheme";
import { ScrollView } from "react-native";

/**
 * Handoff screen 15, in the app (dev builds only): every token and component, in the scheme on
 * screen. Flip « Apparence » to compare light and dark side by side with the mockup.
 */
export const DesignSystemScreen = () => {
  const { layout, space } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: layout.screenMargin, gap: space.xxl, paddingBottom: space.huge }}
    >
      <AppearanceSection />
      <ColorsSection />
      <TypeSection />
      <ButtonsSection />
      <CardSection />
      <FieldsSection />
      <RowsSection />
      <ControlsSection />
      <ChartSection />
      <StatesSection />
    </ScrollView>
  );
};
