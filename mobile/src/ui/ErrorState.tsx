import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { Button } from "@ui/Button";
import { CloudOff } from "lucide-react-native";
import { View } from "react-native";

interface ErrorStateProps {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
  /** Code, time and reference, in `amountS`, for a bug report. */
  details?: string;
}

/** A blocking error, for a screen with nothing in cache: reassuring copy and one way out. */
export const ErrorState = ({ title, message, retryLabel, onRetry, details }: ErrorStateProps) => {
  const { colors, layout, space } = useTheme();
  const tile = layout.icon.xl * 2;
  return (
    <View style={{ alignItems: "center", gap: space.md, paddingVertical: space.huge, paddingHorizontal: space.xxl }}>
      <View
        style={{
          width: tile,
          height: tile,
          borderRadius: tile / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.negativeBg,
        }}
      >
        <CloudOff
          size={layout.icon.xl}
          strokeWidth={layout.iconStroke}
          color={colors.negative}
        />
      </View>
      <AppText
        variant="title2"
        style={{ textAlign: "center" }}
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
      <Button
        label={retryLabel}
        onPress={onRetry}
        block
      />
      {details ? (
        <AppText
          variant="amountS"
          color="ink3"
          selectable
        >
          {details}
        </AppText>
      ) : null}
    </View>
  );
};
