import { PlaceholderScreen } from "@screens/PlaceholderScreen";
import { placeholderText } from "@text/fr/placeholders";
import { Button } from "@ui/Button";
import { BUTTON_VARIANT } from "@ui/variants";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <PlaceholderScreen>
      {__DEV__ ? (
        <Button
          variant={BUTTON_VARIANT.secondary}
          label={placeholderText.openDesignSystem}
          onPress={() => router.push("/design-system")}
        />
      ) : null}
    </PlaceholderScreen>
  );
}
