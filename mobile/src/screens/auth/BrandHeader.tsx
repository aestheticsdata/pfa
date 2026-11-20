import { authText } from "@text/fr/auth";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { TrendingUp } from "lucide-react-native";
import { View } from "react-native";

/** The PFA tile (`surface2`, `positive` curve), name and tagline at the top of the lock and sign-in screens. */
export const BrandHeader = () => {
  const { colors, layout, radius, space } = useTheme();
  const tile = layout.icon.xl * 2.25;
  return (
    <View style={{ alignItems: "center", gap: space.sm }}>
      <View
        style={{
          width: tile,
          height: tile,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface2,
          marginBottom: space.md,
        }}
      >
        <TrendingUp
          size={layout.icon.xl}
          strokeWidth={layout.iconStroke * 1.6}
          color={colors.positive}
        />
      </View>
      <AppText
        variant="title"
        accessibilityRole="header"
      >
        {authText.appName}
      </AppText>
      <AppText
        variant="callout"
        color="ink2"
      >
        {authText.tagline}
      </AppText>
    </View>
  );
};
