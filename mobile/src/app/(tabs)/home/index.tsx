import { useSignOut } from "@hooks/useSignOut";
import { PlaceholderScreen } from "@screens/PlaceholderScreen";
import { authText } from "@text/fr/auth";
import { placeholderText } from "@text/fr/placeholders";
import { useTheme } from "@theme/useTheme";
import { Button } from "@ui/Button";
import { BUTTON_VARIANT } from "@ui/variants";
import { useRouter } from "expo-router";
import { View } from "react-native";

/** The dashboard arrives in lot 4; until Settings exists (lot 9), sign-out lives here. */
export default function HomeScreen() {
  const router = useRouter();
  const signOut = useSignOut();
  const { space } = useTheme();
  return (
    <PlaceholderScreen>
      <View style={{ gap: space.sm, alignItems: "center" }}>
        {__DEV__ ? (
          <Button
            variant={BUTTON_VARIANT.secondary}
            label={placeholderText.openDesignSystem}
            onPress={() => router.push("/design-system")}
          />
        ) : null}
        <Button
          variant={BUTTON_VARIANT.text}
          label={authText.signOut}
          onPress={() => void signOut()}
        />
      </View>
    </PlaceholderScreen>
  );
}
