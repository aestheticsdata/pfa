import { placeholderText } from "@text/fr/placeholders";
import { useTheme } from "@theme/useTheme";
import { EmptyState } from "@ui/EmptyState";
import { Hourglass } from "lucide-react-native";
import { ScrollView } from "react-native";

import type { ReactNode } from "react";

interface PlaceholderScreenProps {
  /** Extra content under the message, e.g. the dev-only link to the design system. */
  children?: ReactNode;
}

/** A tab that exists in the navigation before its lot fills it in. */
export const PlaceholderScreen = ({ children }: PlaceholderScreenProps) => {
  const { colors, layout } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: layout.screenMargin, paddingBottom: layout.navBarHeight * 2 }}
    >
      <EmptyState
        icon={
          <Hourglass
            size={layout.icon.xl}
            strokeWidth={layout.iconStroke}
            color={colors.ink3}
          />
        }
        title={placeholderText.comingTitle}
        message={placeholderText.comingMessage}
        action={children}
      />
    </ScrollView>
  );
};
