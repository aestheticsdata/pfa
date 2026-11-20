import { AUTH_STATUS, useAuth } from "@auth/authStore";
import { useEffect } from "react";

/** Reads the Keychain once at launch; true once the app knows whether someone is signed in. */
export const useAuthBoot = () => {
  const status = useAuth((state) => state.status);
  const boot = useAuth((state) => state.boot);

  useEffect(() => {
    void boot();
  }, [boot]);

  return status !== AUTH_STATUS.booting;
};
