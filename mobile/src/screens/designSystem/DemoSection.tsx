import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { View } from "react-native";

import type { ReactNode } from "react";

interface DemoSectionProps {
  title: string;
  children: ReactNode;
}

/** One block of the design-system screen: an overline, then the specimens. */
export const DemoSection = ({ title, children }: DemoSectionProps) => {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <AppText
        variant="overline"
        color="ink3"
        accessibilityRole="header"
      >
        {title}
      </AppText>
      {children}
    </View>
  );
};
