import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { Card } from "@ui/Card";
import { EmptyState } from "@ui/EmptyState";
import { ErrorState } from "@ui/ErrorState";
import { OfflineBanner } from "@ui/OfflineBanner";
import { Skeleton } from "@ui/Skeleton";
import { Toast } from "@ui/Toast";
import { ReceiptText } from "lucide-react-native";
import { View } from "react-native";

const noop = () => {};

/** Handoff 11-14: empty, loading, offline, error, and the toast of a failed or undoable write. */
export const StatesSection = () => {
  const { colors, layout, space } = useTheme();
  const { states } = designSystemText;
  return (
    <DemoSection title={designSystemText.sections.states}>
      <OfflineBanner
        title={states.offline}
        freshness={states.offlineFreshness}
        retryLabel={states.retry}
        onRetry={noop}
      />
      <Card>
        <View style={{ gap: space.sm }}>
          <Skeleton
            width="40%"
            height={space.md}
            round
          />
          <Skeleton
            width="70%"
            height={layout.iconButton}
          />
          <Skeleton
            width="100%"
            height={layout.meterHeight}
            round
          />
        </View>
      </Card>
      <Card>
        <EmptyState
          icon={
            <ReceiptText
              size={layout.icon.xl}
              strokeWidth={layout.iconStroke}
              color={colors.ink3}
            />
          }
          title={states.emptyTitle}
          message={states.emptyMessage}
        />
      </Card>
      <Card>
        <ErrorState
          title={states.errorTitle}
          message={states.errorMessage}
          retryLabel={states.retry}
          onRetry={noop}
          details={states.errorDetails}
        />
      </Card>
      <Toast
        message={states.toast}
        actionLabel={states.undo}
        onAction={noop}
      />
    </DemoSection>
  );
};
