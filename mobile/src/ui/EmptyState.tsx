import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { View } from "react-native";

import type { ReactNode } from "react";

interface EmptyStateProps {
  /** A stroke illustration or icon, in `ink3`. */
  icon: ReactNode;
  title: string;
  message: string;
  /** A secondary action; the « + » stays the screen's main one. */
  action?: ReactNode;
}

/** What a list says when it has nothing to show: never a blank screen. */
export const EmptyState = ({ icon, title, message, action }: EmptyStateProps) => {
  const { space } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: space.sm, paddingVertical: space.huge, paddingHorizontal: space.xxl }}>
      {icon}
      <AppText
        variant="title2"
        style={{ textAlign: "center", marginTop: space.sm }}
      >
        {title}
      </AppText>
      <AppText
        variant="callout"
        color="ink2"
        style={{ textAlign: "center" }}
      >
        {message}
      </AppText>
      {action ? <View style={{ marginTop: space.md }}>{action}</View> : null}
    </View>
  );
};
