import { create } from "zustand";

import type { ToastState } from "@components/panel/shared/interfaces/sharedTypes";

const TOAST_MS = 2600;
let timer: ReturnType<typeof setTimeout> | undefined;

/** The one toast at a time at the bottom of the panel, and whether the mobile bulk bar is up. */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  raised: false,
  show: (message) => {
    clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), TOAST_MS);
  },
  setRaised: (raised) => set({ raised }),
}));
