import { useAuth } from "@auth/authStore";
import { AUTO_LOCK_DELAY } from "@auth/lockTimer";
import { useBiometricUnlock } from "@hooks/useBiometricUnlock";
import { LOCALE } from "@lib/amount";
import { BrandHeader } from "@screens/auth/BrandHeader";
import { authText } from "@text/fr/auth";
import { useTheme } from "@theme/useTheme";
import { Amount } from "@ui/Amount";
import { AppText } from "@ui/AppText";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { AMOUNT_SIZE, BUTTON_VARIANT } from "@ui/variants";
import { Fingerprint, ScanFace } from "lucide-react-native";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DELAY_LABELS = {
  [AUTO_LOCK_DELAY.immediate]: authText.lock.delays.immediate,
  [AUTO_LOCK_DELAY.oneMinute]: authText.lock.delays.oneMinute,
  [AUTO_LOCK_DELAY.fiveMinutes]: authText.lock.delays.fiveMinutes,
} as Record<number, string>;

/**
 * Handoff screen 01. Nothing real is on screen while locked: the remaining budget is masked. The
 * unlock sits in the thumb zone and Face ID / the fingerprint is asked for as soon as it shows.
 */
export const LockScreen = () => {
  const { colors, layout, radius, space } = useTheme();
  const { support, attempt } = useBiometricUnlock();
  const autoLockDelay = useAuth((state) => state.autoLockDelay);
  const month = new Date().toLocaleDateString(LOCALE, { month: "long" });
  const face = support?.face ?? Platform.OS === "ios";
  const BiometricIcon = face ? ScanFace : Fingerprint;
  const unlockLabel = face && Platform.OS === "ios" ? authText.lock.unlockFace : authText.lock.unlock;

  return (
    <SafeAreaView style={{ flex: 1, paddingHorizontal: layout.screenMargin * 2, justifyContent: "space-between" }}>
      <View style={{ flex: 1, justifyContent: "center", gap: space.huge }}>
        <BrandHeader />
        <Card>
          <View style={{ gap: space.sm }}>
            <AppText
              variant="overline"
              color="ink2"
            >
              {authText.lock.remaining(month)}
            </AppText>
            <Amount
              cents={0}
              size={AMOUNT_SIZE.l}
              color="ink2"
              masked
            />
            <AppText
              variant="callout"
              color="ink2"
            >
              {authText.lock.maskedHint}
            </AppText>
          </View>
        </Card>
      </View>
      <View style={{ alignItems: "center", gap: space.lg, paddingBottom: space.lg }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            width: layout.fab,
            height: layout.fab,
            borderRadius: radius.lg,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.surface2,
          }}
        >
          <BiometricIcon
            size={layout.icon.xl}
            strokeWidth={layout.iconStroke}
            color={colors.accent}
          />
        </View>
        <Button
          label={unlockLabel}
          onPress={() => void attempt()}
          block
        />
        <Button
          label={authText.lock.enterCode}
          onPress={() => void attempt()}
          variant={BUTTON_VARIANT.text}
        />
        <AppText
          variant="footnote"
          color="ink3"
        >
          {authText.lock.autoLock(DELAY_LABELS[autoLockDelay] ?? authText.lock.delays.oneMinute)}
        </AppText>
      </View>
    </SafeAreaView>
  );
};
