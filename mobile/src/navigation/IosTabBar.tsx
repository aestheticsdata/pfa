import { TABS } from "@navigation/tabs";
import { navigationText } from "@text/fr/navigation";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { IconButton } from "@ui/IconButton";
import { BlurView } from "expo-blur";
import { Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TabBarProps } from "@navigation/interfaces/navigationTypes";

/**
 * iOS: a floating glass capsule (expo-blur over `glass`) with the active tab on a `surface3` pill,
 * and the round « + » in the CTA gradient detached on its right.
 */
export const IosTabBar = ({ activeRoute, onSelect, onAdd }: TabBarProps) => {
  const theme = useTheme();
  const { colors, layout, radius, space } = theme;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        left: layout.screenMargin,
        right: layout.screenMargin,
        bottom: Math.max(insets.bottom, space.lg),
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
      }}
    >
      <View
        accessibilityRole="tablist"
        style={[
          {
            flex: 1,
            height: layout.tabBarHeight,
            borderRadius: radius.pill,
            overflow: "hidden",
            borderWidth: layout.hairline,
            borderColor: colors.line,
          },
          theme.elevation.floating,
        ]}
      >
        <BlurView
          intensity={40}
          tint={theme.scheme}
          style={{ flex: 1, flexDirection: "row", padding: space.xs, backgroundColor: colors.glass }}
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
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: space.xxs,
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.surface3 : "transparent",
                }}
              >
                {tab.icon(active ? colors.ink : colors.ink2)}
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
        </BlurView>
      </View>
      <IconButton
        primary
        size={layout.fab}
        label={navigationText.addSpending}
        onPress={onAdd}
        icon={
          <Plus
            size={layout.icon.lg}
            strokeWidth={layout.iconStroke}
            color={colors.onCta}
          />
        }
      />
    </View>
  );
};
