import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useAppFonts } from "@hooks/useAppFonts";
import { useNavigationTheme } from "@navigation/useNavigationTheme";
import { navigationText } from "@text/fr/navigation";
import { COLOR_SCHEME } from "@theme/tokens";
import { useTheme } from "@theme/useTheme";
import { SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

void SplashScreen.preventAutoHideAsync();

/** Sheet detents of the quick-add and category screens: large, as the handoff draws them. */
const LARGE_DETENT = [0.92];

export default function RootLayout() {
  const theme = useTheme();
  const navigationTheme = useNavigationTheme();
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady) void SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <BottomSheetModalProvider>
            <StatusBar style={theme.scheme === COLOR_SCHEME.dark ? COLOR_SCHEME.light : COLOR_SCHEME.dark} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add-spending"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: LARGE_DETENT,
                  sheetGrabberVisible: true,
                  sheetCornerRadius: theme.radius.xl,
                  contentStyle: { backgroundColor: theme.colors.sheet },
                  title: navigationText.titles.addSpending,
                }}
              />
              <Stack.Screen
                name="category-edit"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: LARGE_DETENT,
                  sheetGrabberVisible: true,
                  sheetCornerRadius: theme.radius.xl,
                  contentStyle: { backgroundColor: theme.colors.sheet },
                  title: navigationText.titles.categoryEdit,
                }}
              />
              <Stack.Screen
                name="design-system"
                options={{ presentation: "modal", headerShown: true, title: navigationText.titles.designSystem }}
              />
            </Stack>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
