import { useStackOptions } from "@navigation/useStackOptions";
import { navigationText } from "@text/fr/navigation";
import { Stack } from "expo-router";

export default function StatsStackLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen
        name="index"
        options={{ title: navigationText.titles.stats }}
      />
    </Stack>
  );
}
