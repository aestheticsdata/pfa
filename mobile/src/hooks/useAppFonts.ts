import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from "@expo-google-fonts/geist";
import { GeistMono_400Regular, GeistMono_500Medium, GeistMono_600SemiBold } from "@expo-google-fonts/geist-mono";
import { fonts } from "@theme/tokens";
import { useFonts } from "expo-font";

/** Geist and Geist Mono (OFL), embedded, under the family names the type tokens use. */
export const useAppFonts = () => {
  const [loaded, error] = useFonts({
    [fonts.sans.regular]: Geist_400Regular,
    [fonts.sans.medium]: Geist_500Medium,
    [fonts.sans.semibold]: Geist_600SemiBold,
    [fonts.sans.bold]: Geist_700Bold,
    [fonts.mono.regular]: GeistMono_400Regular,
    [fonts.mono.medium]: GeistMono_500Medium,
    [fonts.mono.semibold]: GeistMono_600SemiBold,
  });
  // A font that fails to load falls back to the system font rather than holding the splash forever.
  return loaded || error !== null;
};
