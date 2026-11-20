import { useStackOptions } from "@navigation/useStackOptions";
import { navigationText } from "@text/fr/navigation";
import { Stack } from "expo-router";

export default function SpendingsStackLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen
        name="index"
        options={{ title: navigationText.titles.spendings }}
      />
    </Stack>
  );
}
