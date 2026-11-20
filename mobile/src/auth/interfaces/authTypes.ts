import type { AUTH_STATUS } from "@auth/authStore";

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

export interface AuthState {
  status: AuthStatus;
  /** Milliseconds in the background before the app locks itself. */
  autoLockDelay: number;
  boot: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  lock: () => void;
  unlock: () => void;
  signOut: () => Promise<void>;
  setAutoLockDelay: (delay: number) => void;
}

/** How the device can prove its owner, for the lock screen's wording and icon. */
export interface BiometricSupport {
  /** Face ID / face unlock rather than a fingerprint. */
  face: boolean;
  /** Biometrics are set up; otherwise the device code is asked directly. */
  enrolled: boolean;
}
