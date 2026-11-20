import { AppTabBar } from "@navigation/AppTabBar";
import { TABS } from "@navigation/tabs";
import { Tabs } from "expo-router/js-tabs";

/** Four tabs, each with its own stack, under the platform's tab bar. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.label }}
        />
      ))}
    </Tabs>
  );
}
