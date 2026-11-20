import { AUTO_LOCK_DELAY } from "@auth/lockTimer";
import { clearToken, readToken, saveToken } from "@auth/tokenStore";
import { storage } from "@lib/storage";
import { create } from "zustand";

import type { AuthState } from "@auth/interfaces/authTypes";

/**
 * Where the app stands: still reading the Keychain, signed out (sign-in screen), signed in but
 * locked (lock screen, amounts masked), or unlocked.
 */
export const AUTH_STATUS = {
  booting: "booting",
  signedOut: "signedOut",
  locked: "locked",
  unlocked: "unlocked",
} as const;

const DELAY_KEY = "auto-lock-delay";

export const useAuth = create<AuthState>((set) => ({
  status: AUTH_STATUS.booting,
  autoLockDelay: storage.getNumber(DELAY_KEY) ?? AUTO_LOCK_DELAY.oneMinute,

  /** At launch: a stored token means a returning user, who still has to unlock. */
  boot: async () => {
    const token = await readToken();
    set({ status: token ? AUTH_STATUS.locked : AUTH_STATUS.signedOut });
  },

  /** Right after a password sign-in the user has just proven who they are: no lock on top. */
  signIn: async (token: string) => {
    await saveToken(token);
    set({ status: AUTH_STATUS.unlocked });
  },

  lock: () => set((state) => (state.status === AUTH_STATUS.unlocked ? { status: AUTH_STATUS.locked } : state)),

  unlock: () => set({ status: AUTH_STATUS.unlocked }),

  /** Forgets the token on the device. The caller revokes it server-side first when it still can. */
  signOut: async () => {
    await clearToken();
    set({ status: AUTH_STATUS.signedOut });
  },

  setAutoLockDelay: (delay: number) => {
    storage.set(DELAY_KEY, delay);
    set({ autoLockDelay: delay });
  },
}));
