import * as LocalAuthentication from "expo-local-authentication";

import type { BiometricSupport } from "@auth/interfaces/authTypes";

/** What the device offers: Face ID / face unlock or a fingerprint, and whether it is set up. */
export const readBiometricSupport = async (): Promise<BiometricSupport> => {
  const [types, enrolled] = await Promise.all([
    LocalAuthentication.supportedAuthenticationTypesAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return { face: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION), enrolled };
};

/**
 * Face ID / BiometricPrompt, falling back to the device code when biometrics fail or are not set
 * up (`disableDeviceFallback: false`). Resolves true when the owner proved who they are.
 */
export const authenticateOwner = async (promptMessage: string, cancelLabel: string) => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel,
    disableDeviceFallback: false,
  });
  return result.success;
};
