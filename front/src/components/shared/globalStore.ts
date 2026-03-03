import { create } from "zustand";
import produce from "immer";
import { devtools } from 'zustand/middleware';


interface GlobalStore {
  isCalendarVisible: boolean;
  setIsCalendarVisible: (isCalendarVisible: boolean) => void;
}

export const useGlobalStore = create<GlobalStore>()(
  devtools((set) => ({
    isCalendarVisible: false,
    setIsCalendarVisible: (isVisible: boolean) =>
      set(
        produce((draft: GlobalStore) => {
          draft.isCalendarVisible = isVisible;
        })
      ),
  }))
);

export default useGlobalStore;
