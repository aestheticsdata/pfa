import { useAuth } from "@auth/authStore";
import { authenticateOwner, readBiometricSupport } from "@auth/biometrics";
import { authText } from "@text/fr/auth";
import { useEffect, useState } from "react";

import type { BiometricSupport } from "@auth/interfaces/authTypes";

/**
 * The lock screen's unlock: asks for Face ID / the fingerprint as soon as the screen shows, and
 * again on demand. A failure or a cancel leaves the screen locked; the device code is the fallback.
 */
export const useBiometricUnlock = () => {
  const unlock = useAuth((state) => state.unlock);
  const [support, setSupport] = useState<BiometricSupport | null>(null);

  const attempt = async () => {
    if (await authenticateOwner(authText.lock.prompt, authText.lock.cancel)) unlock();
  };

  useEffect(() => {
    let cancelled = false;
    void readBiometricSupport().then((found) => {
      if (cancelled) return;
      setSupport(found);
      if (found.enrolled) void attempt();
    });
    return () => {
      cancelled = true;
    };
    // Once, when the lock screen appears: re-prompting on every render would loop on a cancel.
  }, []);

  return { support, attempt };
};
