import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { View } from "react-native";

/** Every colour token as a swatch, then the category hues. */
export const ColorsSection = () => {
  const { colors, categoryColors, radius, layout, space } = useTheme();
  const swatch = layout.iconButton;
  return (
    <DemoSection title={designSystemText.sections.colors}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {Object.entries(colors).map(([name, value]) => (
          <View
            key={name}
            style={{ width: swatch * 1.6, gap: space.xs }}
          >
            <View
              style={{
                height: swatch,
                borderRadius: radius.sm,
                backgroundColor: value,
                borderWidth: layout.hairline,
                borderColor: colors.line,
              }}
            />
            <AppText
              variant="caption"
              color="ink2"
              numberOfLines={1}
            >
              {name}
            </AppText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {Object.entries(categoryColors).map(([name, value]) => (
          <View
            key={name}
            accessibilityLabel={name}
            style={{ width: swatch, height: swatch / 2, borderRadius: radius.xs, backgroundColor: value }}
          />
        ))}
      </View>
    </DemoSection>
  );
};
