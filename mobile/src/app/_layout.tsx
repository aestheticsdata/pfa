import { AUTH_STATUS, useAuth } from "@auth/authStore";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useAppFonts } from "@hooks/useAppFonts";
import { useAuthBoot } from "@hooks/useAuthBoot";
import { useAutoLock } from "@hooks/useAutoLock";
import { useIsAppActive } from "@hooks/useIsAppActive";
import { queryClient } from "@lib/queryClient";
import { useNavigationTheme } from "@navigation/useNavigationTheme";
import { QueryClientProvider } from "@tanstack/react-query";
import { navigationText } from "@text/fr/navigation";
import { COLOR_SCHEME } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { PrivacyCover } from "@ui/PrivacyCover";
import { SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

void SplashScreen.preventAutoHideAsync();

/** Sheet detents of the quick-add and category screens: large, as the handoff draws them. */
const LARGE_DETENT = [0.92];

/**
 * Providers, then three guarded areas: sign-in while signed out, the lock screen while locked,
 * the app once unlocked. The splash stays up until fonts and the Keychain have answered.
 */
export default function RootLayout() {
  const theme = useTheme();
  const navigationTheme = useNavigationTheme();
  const fontsReady = useAppFonts();
  const authReady = useAuthBoot();
  const status = useAuth((state) => state.status);
  const active = useIsAppActive();
  useAutoLock();

  const ready = fontsReady && authReady;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const sheet = {
    presentation: "formSheet" as const,
    sheetAllowedDetents: LARGE_DETENT,
    sheetGrabberVisible: true,
    sheetCornerRadius: theme.radius.xl,
    contentStyle: { backgroundColor: theme.colors.sheet },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <BottomSheetModalProvider>
              <StatusBar style={theme.scheme === COLOR_SCHEME.dark ? COLOR_SCHEME.light : COLOR_SCHEME.dark} />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
                <Stack.Protected guard={status === AUTH_STATUS.signedOut}>
                  <Stack.Screen name="sign-in" />
                </Stack.Protected>
                <Stack.Protected guard={status === AUTH_STATUS.locked}>
                  <Stack.Screen
                    name="lock"
                    options={{ animation: "fade" }}
                  />
                </Stack.Protected>
                <Stack.Protected guard={status === AUTH_STATUS.unlocked}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="add-spending"
                    options={{ ...sheet, title: navigationText.titles.addSpending }}
                  />
                  <Stack.Screen
                    name="category-edit"
                    options={{ ...sheet, title: navigationText.titles.categoryEdit }}
                  />
                  <Stack.Screen
                    name="design-system"
                    options={{ presentation: "modal", headerShown: true, title: navigationText.titles.designSystem }}
                  />
                </Stack.Protected>
              </Stack>
              {active ? null : <PrivacyCover />}
            </BottomSheetModalProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
