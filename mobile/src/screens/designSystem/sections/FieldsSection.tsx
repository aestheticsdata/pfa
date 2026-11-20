import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { TextField } from "@ui/TextField";
import { View } from "react-native";

export const FieldsSection = () => {
  const { space } = useTheme();
  const { fields } = designSystemText;
  return (
    <DemoSection title={designSystemText.sections.fields}>
      <View style={{ gap: space.md }}>
        <TextField
          placeholder={fields.placeholder}
          accessibilityLabel={fields.placeholder}
        />
        <TextField
          defaultValue={fields.filled}
          accessibilityLabel={fields.placeholder}
        />
        <TextField
          placeholder={fields.amountPlaceholder}
          accessibilityLabel={fields.amountPlaceholder}
          error={fields.amountError}
          keyboardType="decimal-pad"
        />
      </View>
    </DemoSection>
  );
};
