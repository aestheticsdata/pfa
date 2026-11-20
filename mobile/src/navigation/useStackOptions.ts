import { useTheme } from "@theme/useTheme";
import { Platform } from "react-native";

/**
 * Each tab's stack header: on iOS a large title (32/38) that collapses as the list scrolls; on
 * Android a medium top app bar. Back keeps the parent's label on iOS, the arrow on Android.
 */
export const useStackOptions = () => {
  const { colors, type } = useTheme();
  return {
    headerLargeTitle: Platform.OS === "ios",
    headerTransparent: Platform.OS === "ios",
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerStyle: { backgroundColor: Platform.OS === "ios" ? "transparent" : colors.bg },
    headerTintColor: colors.accent,
    headerTitleStyle: { fontFamily: type.headline.fontFamily, color: colors.ink },
    headerLargeTitleStyle: { fontFamily: type.largeTitle.fontFamily, color: colors.ink },
    contentStyle: { backgroundColor: colors.bg },
  };
};
