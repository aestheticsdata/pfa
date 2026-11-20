import { AndroidNavigationBar } from "@navigation/AndroidNavigationBar";
import { IosTabBar } from "@navigation/IosTabBar";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

import type { BottomTabBarProps } from "expo-router/js-tabs";

/** The app's tab bar, drawn per platform: glass capsule on iOS, Material 3 bar + FAB on Android. */
export const AppTabBar = ({ state, navigateToTab }: BottomTabBarProps) => {
  const router = useRouter();
  const activeRoute = state.routes[state.index]?.name ?? "";

  const onSelect = (routeName: string) => {
    const route = state.routes.find((candidate) => candidate.name === routeName);
    if (route) navigateToTab(route.key);
  };

  const onAdd = () => router.push("/add-spending");

  const props = { activeRoute, onSelect, onAdd };
  return Platform.OS === "ios" ? <IosTabBar {...props} /> : <AndroidNavigationBar {...props} />;
};
