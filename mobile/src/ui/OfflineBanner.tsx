import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { WifiOff } from "lucide-react-native";
import { Pressable, View } from "react-native";

interface OfflineBannerProps {
  title: string;
  /** « Données du 20 nov., 14:32 » — how old what is on screen is. */
  freshness: string;
  retryLabel: string;
  onRetry: () => void;
}

/** Under the title while the network is gone: the screen still shows its cached data. */
export const OfflineBanner = ({ title, freshness, retryLabel, onRetry }: OfflineBannerProps) => {
  const { colors, layout, radius, space } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        padding: space.md,
        borderRadius: radius.sm,
        backgroundColor: colors.warningBg,
      }}
    >
      <WifiOff
        size={layout.icon.md}
        strokeWidth={layout.iconStroke}
        color={colors.warning}
      />
      <View style={{ flex: 1 }}>
        <AppText
          variant="subhead"
          color="warning"
        >
          {title}
        </AppText>
        <AppText
          variant="footnote"
          color="ink2"
        >
          {freshness}
        </AppText>
      </View>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        hitSlop={space.sm}
        style={{ minHeight: layout.minTouch, justifyContent: "center" }}
      >
        <AppText
          variant="subhead"
          color="accent"
        >
          {retryLabel}
        </AppText>
      </Pressable>
    </View>
  );
};
