import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface GlobalStore {
  isCalendarVisible: boolean;
  setIsCalendarVisible: (isCalendarVisible: boolean) => void;
}

export const useGlobalStore = create<GlobalStore>()(
  devtools((set) => ({
    isCalendarVisible: false,
    setIsCalendarVisible: (isVisible: boolean) =>
      set((state) => (state.isCalendarVisible === isVisible ? state : { isCalendarVisible: isVisible })),
  })),
);

export default useGlobalStore;
