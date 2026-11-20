import { TABS } from "@navigation/tabs";
import { navigationText } from "@text/fr/navigation";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { Gradient } from "@ui/Gradient";
import { Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TabBarProps } from "@navigation/interfaces/navigationTypes";

/**
 * Android: a Material 3 navigation bar (`surface2`, 64×32 `accentBg` pill behind the active icon)
 * with the extended FAB « + Dépense » floating above its right end.
 */
export const AndroidNavigationBar = ({ activeRoute, onSelect, onAdd }: TabBarProps) => {
  const theme = useTheme();
  const { colors, layout, radius, space } = theme;
  const insets = useSafeAreaInsets();

  return (
    <View>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={navigationText.addSpending}
        style={[
          {
            position: "absolute",
            right: layout.screenMargin,
            bottom: layout.navBarHeight + insets.bottom + space.lg,
            borderRadius: radius.md,
            overflow: "hidden",
          },
          theme.elevation.floating,
        ]}
      >
        <Gradient
          token={theme.gradients.cta}
          style={{
            height: layout.fabExtendedHeight,
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            paddingHorizontal: space.xl,
          }}
        >
          <Plus
            size={layout.icon.lg}
            strokeWidth={layout.iconStroke}
            color={colors.onCta}
          />
          <AppText
            variant="headline"
            color="onCta"
          >
            {navigationText.addSpendingShort}
          </AppText>
        </Gradient>
      </Pressable>
      <View
        accessibilityRole="tablist"
        style={{
          height: layout.navBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          flexDirection: "row",
          backgroundColor: colors.surface2,
        }}
      >
        {TABS.map((tab) => {
          const active = tab.name === activeRoute;
          return (
            <Pressable
              key={tab.name}
              onPress={() => onSelect(tab.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: space.xs }}
            >
              <View
                style={{
                  ...layout.navIndicator,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? colors.accentBg : "transparent",
                }}
              >
                {tab.icon(active ? colors.accent : colors.ink2)}
              </View>
              <AppText
                variant="tabLabel"
                color={active ? "ink" : "ink2"}
                numberOfLines={1}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
